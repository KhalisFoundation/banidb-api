import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import Ajv from 'ajv';
import { startApp } from './app';

// The spec must describe what the API really answers: every request of the
// contract test is checked against the schema documented for its route,
// method and status.
type Request = string | { method: string; path: string; body: string };
const requests = JSON.parse(
  readFileSync(join(__dirname, 'contract', 'requests.json'), 'utf8'),
) as Request[];

// Addresses the API doesn't have, so the spec doesn't either.
const UNKNOWN = ['/v2/nope', '/nope', '/', '/v2/shabads'];

describe('OpenAPI', () => {
  let app: INestApplication;
  let url: string;
  let spec: any;
  // OpenAPI 3.0 schemas carry keywords JSON Schema doesn't have (`example`).
  const ajv = new Ajv({ strict: false });

  // The documented path a request falls under, e.g. /v2/shabads/1 → /v2/shabads/{ShabadID}.
  const documentedPath = (request: string) => {
    const path = request.split('?')[0].replace(/^\/v2\/\//i, '/v2/');
    return Object.keys(spec.paths).find((documented) =>
      new RegExp(`^${documented.replace(/\{\w+\}/g, '[^/]+')}/?$`, 'i').test(path),
    );
  };

  // Sends the request and checks the body against the schema for its status.
  const check = async (r: Request, i: number) => {
    const { method, path, body } = typeof r === 'string' ? { method: 'GET', path: r } : r;
    const res = await fetch(url + path, {
      method,
      body,
      headers: {
        'content-type': 'application/json',
        // Its own client IP, so rate limits stay out of it.
        'x-forwarded-for': `198.18.0.${i % 250}`,
      },
    });
    const documented = documentedPath(path);
    const response =
      documented && spec.paths[documented][method.toLowerCase()]?.responses[res.status];
    expect({ path, status: res.status, documented: !!response }).toEqual({
      path,
      status: res.status,
      documented: true,
    });
    const schema = JSON.parse(
      JSON.stringify(response.content['application/json'].schema).replaceAll('"#/', '"spec#/'),
    );
    const validate = ajv.compile(schema);
    validate(await res.json());
    expect(validate.errors ?? []).toEqual([]);
  };

  beforeAll(async () => {
    ({ app, url } = await startApp());
    spec = await (await fetch(`${url}/v2/openapi.json`)).json();
    ajv.addSchema(spec, 'spec');
  });
  afterAll(() => app.close());

  it('serves the spec as JSON and YAML, Swagger UI, and the old docs address', async () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toBe('BaniDB API');

    const yaml = await fetch(`${url}/v2/openapi.yaml`);
    expect(yaml.status).toBe(200);
    expect(await yaml.text()).toContain('/v2/shabads/{ShabadID}:');

    const ui = await fetch(`${url}/v2/docs`);
    expect(ui.status).toBe(200);
    expect(await ui.text()).toContain('swagger-ui');

    const old = await fetch(`${url}/v2/api-docs`, { redirect: 'manual' });
    expect(old.status).toBe(301);
    expect(old.headers.get('location')).toBe('/v2/docs');
  });

  it('documents every route, each with a summary and a 200 response', () => {
    const paths = requests.map((r) => (typeof r === 'string' ? r : r.path));
    expect([...new Set(paths.filter((path) => !documentedPath(path)))]).toEqual(UNKNOWN);

    for (const [path, methods] of Object.entries<any>(spec.paths)) {
      for (const [method, operation] of Object.entries<any>(methods)) {
        expect({
          path,
          method,
          summary: !!operation.summary,
          ok: !!operation.responses[200],
        }).toEqual({
          path,
          method,
          summary: true,
          ok: true,
        });
        // Every {parameter} in the path is described, and nothing else is called a path parameter.
        const inPath = (operation.parameters ?? [])
          .filter((p: any) => p.in === 'path')
          .map((p: any) => p.name);
        expect(inPath.sort()).toEqual(Array.from(path.matchAll(/\{(\w+)\}/g), (m) => m[1]).sort());
      }
    }
  });

  const documentedRequests = requests.filter(
    (r) => !UNKNOWN.includes(typeof r === 'string' ? r : r.path),
  );
  it.each(
    documentedRequests.map((r, i) => [typeof r === 'string' ? r : `POST ${r.body}`, r, i] as const),
  )('%s answers as documented', async (_, r, i) => {
    await check(r, i);
  });
});

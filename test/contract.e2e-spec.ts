import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { startApp } from './app';

// What the old Express API answered for each request (test/contract/old-api.json,
// recorded with test/contract/capture.mjs against the same test database and
// Meilisearch index).
interface Recorded {
  status: number;
  contentType: string | null;
  cacheControl: string | null;
  body: unknown;
}
type Request = string | { method: string; path: string; body: string };

const requests = JSON.parse(
  readFileSync(join(__dirname, 'contract', 'requests.json'), 'utf8'),
) as Request[];
const contract = JSON.parse(
  readFileSync(join(__dirname, 'contract', 'old-api.json'), 'utf8'),
) as Record<string, Recorded>;
const keyOf = (r: Request) => (typeof r === 'string' ? r : `${r.method} ${r.path} ${r.body}`);

const NOT_CACHEABLE = 'no-cache,max-age=0';
const JSON_TYPE = 'application/json; charset=utf-8';
const error = (message: string) => ({ error: true, data: { error: message } });
const notFound = (status: number, message: string): Partial<Recorded> => ({
  status,
  body: error(message),
});
const empty = (body: unknown): Partial<Recorded> => ({
  status: 200,
  cacheControl: 'max-age=21600',
  body,
});

// Where the new API deliberately answers differently. Each of these was a 500
// carrying the SQL error.
const changes: Record<string, Partial<Recorded>> = {
  // Only < or > with nothing else made broken SQL.
  '/v2/angs/%3C5': notFound(404, 'That ang does not exist or no updates found.'),
  // A bani, header, shabad or rehat ID that isn't a number is one that doesn't exist.
  '/v2/banis/abc': notFound(404, 'Bani does not exist or no updates found for specified Bani.'),
  '/v2/amritkeertan/shabads/abc': notFound(404, 'Shabad does not exist or has no updates.'),
  '/v2/amritkeertan/index/abc': empty({ header: [], index: [] }),
  '/v2/rehats/abc': empty({ count: 0, rehatID: null, chapters: [] }),
  '/v2/rehats/abc/chapters': empty({ count: 0, rehatID: null, chapters: [] }),
};

function expected(key: string): Recorded {
  const want = { ...contract[key], ...changes[key] };
  const graphql = key.includes('/v2/graphql');
  // A 500 no longer carries the error object, SQL or stack trace.
  if (want.status === 500 && !graphql) want.body = error('Internal server error');
  // Errors are no longer cached for 6 hours (GraphQL writes its own response, as before).
  if (want.status >= 400 && !graphql) want.cacheControl = NOT_CACHEABLE;
  if (want.status >= 400 && typeof want.body === 'object') want.contentType = JSON_TYPE;
  return want;
}

// Values that depend on when and where the test runs: the version and host
// name on /v2, and the host in next-page links.
type Json = Record<string, unknown>;
const normalise = (key: string, body: unknown): unknown =>
  key === '/v2'
    ? { ...(body as Json), version: '*', endpoint: '*' }
    : typeof body === 'object' && body !== null
      ? JSON.parse(JSON.stringify(body).replace(/("nextPage":"https?:\/\/)[^/]+/g, '$1HOST'))
      : body;

// Search sorts by shabad only, so the lines of one shabad come back in an order
// that depends on the database's query plan. old-api.json was recorded on
// MariaDB, which the tests compare exactly; on MySQL (DB_KIND=mysql) the lines
// are compared sorted, and where results run over several pages (a page can
// end inside a shabad) only the page counts and the order of shabads.
interface Verse {
  shabadId?: number;
  verseId: number;
}
interface Results {
  resultsInfo?: { pages?: { totalPages?: number } };
  verses?: Verse[];
}
function forMySql(key: string, body: unknown) {
  const results = body as Results | null;
  const verses = results?.verses;
  if (process.env.DB_KIND !== 'mysql' || !key.startsWith('/v2/search/') || !Array.isArray(verses)) {
    return body;
  }
  if ((results?.resultsInfo?.pages?.totalPages ?? 0) > 1) {
    return { resultsInfo: results?.resultsInfo, shabads: verses.map((verse) => verse.shabadId) };
  }
  const sorted = [...verses].sort(
    (a, b) => (a.shabadId ?? -1) - (b.shabadId ?? -1) || a.verseId - b.verseId,
  );
  return { ...(body as Json), verses: sorted };
}

describe('responses match the old API', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    ({ app, url } = await startApp());
  });
  afterAll(() => app.close());

  it('has a recorded answer for every request', () => {
    expect(requests.map(keyOf).filter((key) => !contract[key])).toEqual([]);
  });

  it.each(requests.map((r) => [keyOf(r).slice(0, 120), r] as const))('%s', async (_, r) => {
    const key = keyOf(r);
    // From another (made-up) client IP for each request, so rate limits stay out of it.
    const ip = `198.51.100.${requests.indexOf(r) % 250}`;
    const res =
      typeof r === 'string'
        ? await fetch(url + r, { headers: { 'x-forwarded-for': ip } })
        : await fetch(url + r.path, {
            method: r.method,
            headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
            body: r.body,
          });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // plain text
    }
    const want = expected(key);
    const got = {
      status: res.status,
      contentType: res.headers.get('content-type'),
      cacheControl: res.headers.get('cache-control'),
      body: forMySql(key, normalise(key, body)),
    };
    const wantBody = forMySql(key, normalise(key, want.body));
    expect(got).toEqual({ ...want, body: wantBody });
    // Same JSON text, so key order is the same too.
    expect(JSON.stringify(got.body)).toBe(JSON.stringify(wantBody));
  });

  it('reports the version from package.json', async () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
    const body = (await (await fetch(`${url}/v2`)).json()) as { version: string };
    expect(body.version).toBe(pkg.version);
  });
});

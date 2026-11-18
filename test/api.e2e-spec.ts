import type { INestApplication } from '@nestjs/common';
import { startApp } from './app';

// Behaviour the contract test doesn't pin down: bad input (several of these
// crashed the old API's process), random shabads, headers, load, GraphiQL.
// Runs on MariaDB and MySQL alike (DB_PORT).

const long = (n: number) => '9'.repeat(n);

const neverFail = [
  // These crashed the old process (pm2 restarted it).
  '/v2/search/%2B?searchtype=0',
  '/v2/search/-?searchtype=0',
  '/v2/search/%2B?searchtype=2',
  '/v2/search/-?searchtype=4',
  '/v2/search/%2B?searchtype=3',
  '/v2/search/%2B?searchtype=6',
  '/v2/search/h?source[]=G',
  '/v2/search/h?source[a]=G',
  '/v2/amritkeertan/index/abc',
  // These answered 500.
  '/v2/angs/%3C5',
  '/v2/angs/%3E1428',
  '/v2/banis/abc',
  '/v2/banis/2?length=constructor',
  '/v2/rehats/search',
  '/v2/rehats/abc/chapters/1',
  '/v2/amritkeertan/shabads/abc',
  '/v2/kosh/ab',
  // MySQL fails queries that MariaDB quietly runs.
  '/v2/hukamnamas/2019/2/30',
  '/v2/hukamnamas/2019/2/0',
  '/v2/shabads/1?updatedsince=2019-02-30',
  '/v2/shabads/1?updatedsince=0000-00-00',
  '/v2/shabads/1?updatedsince[]=2019-01-01',
  '/v2/angs/1?updatedsince=2019-13-01',
  '/v2/search/s?updatedsince=2019-02-30',
  // Anything else odd.
  `/v2/shabads/${long(30)}`,
  `/v2/angs/${long(30)}`,
  `/v2/banis/${long(30)}`,
  `/v2/search/${long(2000)}`,
  `/v2/search-results/${long(30)}`,
  '/v2/search/%F0%9F%98%80?searchtype=0',
  '/v2/search/%F0%9F%98%80?searchtype=8',
  "/v2/search/'%20OR%201=1--?searchtype=2",
  '/v2/search/s?page=-5&results=-5',
  '/v2/search-results/3?page=-1',
  '/v2/kosh/word/%25',
  '/v2/random/x',
  '/v2/hukamnamas/abc/def/ghi',
];

describe('API', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => ({ app, url } = await startApp()));
  afterAll(() => app.close());

  // Each request from its own client IP, so rate limits stay out of the way.
  let ip = 0;
  const get = (path: string, headers: Record<string, string> = {}) =>
    fetch(url + path, { headers: { 'x-forwarded-for': `192.0.2.${(ip += 1) % 250}`, ...headers } });

  it.each(neverFail)('GET %s is not a server error', async (path) => {
    const res = await get(path);
    expect(res.status).toBeLessThan(500);
    expect(res.headers.get('content-type')).toMatch(/^application\/json/);
  });

  it('answers /random with a shabad, never from a cache', async () => {
    for (const source of ['', '/G', '/D', '/all', '/x']) {
      const res = await get(`/v2/random${source}`);
      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('no-cache,max-age=0');
      const body = (await res.json()) as { shabadInfo?: unknown; verses?: unknown[] };
      // A shabad of the source, or {} for one that isn't published.
      if (body.shabadInfo) expect(body.verses?.length).toBeGreaterThan(0);
    }
  });

  it('caches the hukamnama for half an hour and content for six', async () => {
    expect((await get('/v2/hukamnamas')).headers.get('cache-control')).toBe('max-age=1800');
    expect((await get('/v2/shabads/1')).headers.get('cache-control')).toBe('max-age=21600');
  });

  it('allows any origin and varies on it', async () => {
    const res = await get('/v2/shabads/1', { origin: 'https://example.com' });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('vary')).toMatch(/Origin/);

    const preflight = await fetch(`${url}/v2/graphql`, {
      method: 'OPTIONS',
      headers: { origin: 'https://example.com', 'access-control-request-method': 'POST' },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('answers paths with one extra slash after /v2, as before', async () => {
    expect((await get('/v2//shabads/1')).status).toBe(200);
  });

  it('links the next page over the same protocol as the request (http behind the proxy), as before', async () => {
    const body = (await (await get('/v2/search/s?results=2')).json()) as {
      resultsInfo: { pages: { nextPage: string } };
    };
    expect(body.resultsInfo.pages.nextPage).toMatch(
      /^http:\/\/127\.0\.0\.1:\d+\/v2\/search\/s\?results=2&page=2$/,
    );
  });

  it('serves GraphiQL to a browser', async () => {
    const res = await get('/v2/graphql', { accept: 'text/html' });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('graphiql');
  });

  it('answers GraphQL errors as GraphQL does', async () => {
    const res = await fetch(`${url}/v2/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ nope }' }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      errors: [
        {
          message: 'Cannot query field "nope" on type "Query".',
          locations: [{ line: 1, column: 3 }],
        },
      ],
    });
  });

  // The old API held a connection while waiting for others (shabads with their
  // navigation, hukamnamas), so a handful of parallel requests used up the
  // pool and timed out. The tests run with a pool of 4.
  it('answers many parallel requests with a small pool', async () => {
    const paths = Array.from({ length: 12 }, (_, i) => [
      '/v2/shabads/1,2,7,17',
      '/v2/hukamnamas/2019/12/26',
      `/v2/angs/1-3?i=${i}`,
    ]).flat();
    const statuses = await Promise.all(paths.map(async (path) => (await get(path)).status));
    expect(statuses).toEqual(paths.map(() => 200));
  });
});

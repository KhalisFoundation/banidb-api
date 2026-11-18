import type { INestApplication } from '@nestjs/common';
import { startApp } from './app';

describe('rate limits', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    ({ app, url } = await startApp());
  });
  afterAll(() => app.close());

  const hit = (path: string, ip: string, init: RequestInit = {}) =>
    fetch(url + path, { ...init, headers: { ...init.headers, 'x-forwarded-for': ip } });

  // Behind the proxy, each client IP gets its own allowance (the old API saw
  // the proxy's address).
  it('limits each client IP, not everyone behind the proxy together', async () => {
    for (let i = 0; i < 100; i++) expect((await hit('/v2', '203.0.113.1')).status).toBe(200);

    const limited = await hit('/v2', '203.0.113.1');
    expect(limited.status).toBe(429);
    expect(await limited.text()).toBe('Too Many Requests');
    // Unlike before, a 429 isn't cached for 6 hours.
    expect(limited.headers.get('cache-control')).toBe('no-cache,max-age=0');

    expect((await hit('/v2', '203.0.113.2')).status).toBe(200);
  });

  it('allows 250 a minute on search', async () => {
    const statuses = await Promise.all(
      Array.from({ length: 251 }, () => hit('/v2/search/5?searchtype=5', '203.0.113.3')),
    ).then((all) => all.map((res) => res.status));
    expect(statuses.filter((status) => status === 200)).toHaveLength(250);
    expect(statuses.filter((status) => status === 429)).toHaveLength(1);
  });

  // GraphQL had no limit at all.
  it('limits GraphQL too', async () => {
    const query = {
      method: 'POST',
      body: '{"query":"{ banis { ID } }"}',
      headers: { 'content-type': 'application/json' },
    };
    for (let i = 0; i < 100; i++) await hit('/v2/graphql', '203.0.113.4', query);
    expect((await hit('/v2/graphql', '203.0.113.4', query)).status).toBe(429);
  });
});

// Records what a running API answers for every request in requests.json, so
// the rewrite can be compared against the old API on the same data:
//   node test/contract/capture.mjs http://localhost:3001 > test/contract/old-api.json
// A request is a GET path, or { method, path, body } (GraphQL POSTs).
import { readFileSync } from 'node:fs';
import http from 'node:http';

const base = process.argv[2];
const requests = JSON.parse(readFileSync(new URL('./requests.json', import.meta.url)));
export const keyOf = (r) => (typeof r === 'string' ? r : `${r.method} ${r.path} ${r.body}`);

// The old API rate-limits per socket address, so requests come from a
// different loopback address each time (Linux answers on all of 127.0.0.0/8).
let n = 0;
const send = (r) =>
  new Promise((resolve, reject) => {
    const { method = 'GET', path = r, body } = typeof r === 'string' ? {} : r;
    const url = new URL(base + path);
    n += 1;
    const req = http.request(
      {
        host: url.hostname,
        port: url.port,
        method,
        path: url.pathname + url.search,
        localAddress: `127.0.${Math.floor(n / 250) % 250}.${(n % 250) + 2}`,
        headers: body === undefined ? {} : { 'content-type': 'application/json' },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: { get: (name) => res.headers[name] ?? null },
            text: async () => Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    req.on('error', reject);
    req.end(body);
  });

// The old API crashes on some requests (pm2 restarted it): wait and try again;
// if it keeps failing, record that.
async function answer(r) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await send(r);
    } catch {
      await new Promise((ok) => setTimeout(ok, 2500));
    }
  }
  return null;
}

const out = {};
for (const r of requests) {
  const res = await answer(r);
  if (!res) {
    out[keyOf(r)] = { status: 0, contentType: null, cacheControl: null, body: 'crashed' };
    continue;
  }
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  out[keyOf(r)] = {
    status: res.status,
    contentType: res.headers.get('content-type'),
    cacheControl: res.headers.get('cache-control'),
    body,
  };
}
// One request per line, so a change shows up as that request's line.
const lines = Object.entries(out).map(
  ([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`,
);
process.stdout.write(`{\n${lines.join(',\n')}\n}\n`);

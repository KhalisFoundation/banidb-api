// Smoke tests against a deployed API (they check real BaniDB data):
//   npm run test:live                               the dev API
//   API_ENV=prod npm run test:live                  https://api.banidb.com
//   API_URL=http://localhost:3001/v2/ npm run test:live
const urls: Record<string, string> = {
  local: 'http://localhost:3001/v2/',
  dev: 'https://api.khajana.org/v2/',
  prod: 'https://api.banidb.com/v2/',
};

const api = process.env.API_URL ?? urls[process.env.API_ENV ?? 'dev'];

export async function geturl(path: string) {
  const res = await fetch(`${api}${path}`);
  return { status: res.status, json: await res.json() };
}

// e2e tests run against the docker compose services (`npm run db`).
const defaults: Record<string, string> = {
  BDB_HOST: '127.0.0.1',
  BDB_PORT: process.env.DB_PORT ?? '33316',
  BDB_DATABASE: 'banidb',
  BDB_USER: 'root',
  BDB_PASSWORD: 'root',
  DB_POOL_SIZE: '4',
  MEILI_HOST: `http://127.0.0.1:${process.env.MEILI_PORT ?? '37700'}`,
  MEILI_API_KEY: 'local-test-key-0123456789',
  // Hukamnama dates are read in the server's time zone; production runs in UTC.
  TZ: 'UTC',
};
for (const [key, value] of Object.entries(defaults)) process.env[key] ??= value;

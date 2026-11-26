import { loadConfig, missingSettings } from './config';

// A local docker database without TLS; real deployments set SSL_CA.
const LOCAL = { DB_ALLOW_NO_TLS: 'true' };

describe('loadConfig', () => {
  it('uses one server from BDB_HOST/BDB_PORT', () => {
    const config = loadConfig({
      BDB_HOST: 'bdb.db',
      BDB_PORT: '5001',
      BDB_USER: 'u',
      BDB_PASSWORD: 'p',
      BDB_DATABASE: 'banidb',
      DB_POOL_SIZE: '7',
      ...LOCAL,
    });
    expect(config.db).toHaveLength(1);
    expect(config.db[0]).toMatchObject({
      host: 'bdb.db',
      port: 5001,
      user: 'u',
      password: 'p',
      database: 'banidb',
      connectionLimit: 7,
      dateStrings: true,
      decimalAsNumber: true,
      bigIntAsNumber: true,
      autoJsonMap: false,
    });
  });

  it('defaults like the old API: localhost, root/root, a pool of 10', () => {
    expect(loadConfig(LOCAL).db[0]).toMatchObject({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root',
      connectionLimit: 10,
    });
  });

  it('builds a cluster from DB_NODES, replicas with a small idle pool', () => {
    const config = loadConfig({
      DB_NODES: JSON.stringify([
        { host: 'primary', port: 6033, isPrimary: true },
        { host: 'replica' },
      ]),
      ...LOCAL,
    });
    expect(config.db).toHaveLength(2);
    expect(config.db[0]).toMatchObject({ host: 'primary', port: 6033 });
    expect(config.db[0].minimumIdle).toBeUndefined();
    expect(config.db[1]).toMatchObject({ host: 'replica', port: 3306, minimumIdle: 2 });
  });

  it('refuses to start without TLS unless DB_ALLOW_NO_TLS is set', () => {
    expect(() => loadConfig({})).toThrow(/SSL_CA is not set/);
    expect(() => loadConfig({ DB_ALLOW_NO_TLS: '1' })).toThrow(/SSL_CA is not set/);
  });

  it('uses TLS when SSL_CA is set, and never fetches the server key then', () => {
    const tls = loadConfig({ SSL_CA: __filename });
    expect(tls.db[0].ssl).toEqual({ ca: expect.any(String) });
    expect(tls.db[0].allowPublicKeyRetrieval).toBeUndefined();
    const both = loadConfig({ SSL_CA: __filename, ...LOCAL });
    expect(both.db[0].allowPublicKeyRetrieval).toBeUndefined();
  });

  it('lets a local database without TLS fetch the MySQL 8 server key', () => {
    expect(loadConfig(LOCAL).db[0].ssl).toBeUndefined();
    expect(loadConfig(LOCAL).db[0].allowPublicKeyRetrieval).toBe(true);
  });

  it('listens on 3000, 3001 in development, or PORT', () => {
    expect(loadConfig(LOCAL).port).toBe(3000);
    expect(loadConfig({ NODE_ENV: 'development', ...LOCAL }).port).toBe(3001);
    expect(loadConfig({ PORT: '8080', ...LOCAL }).port).toBe(8080);
  });

  it('reads Meilisearch only when MEILI_HOST is set', () => {
    expect(loadConfig(LOCAL).meili).toBeNull();
    expect(loadConfig({ MEILI_HOST: 'http://m', MEILI_API_KEY: 'k', ...LOCAL }).meili).toEqual({
      host: 'http://m',
      apiKey: 'k',
    });
  });
});

describe('missingSettings', () => {
  it('lists unset credentials and Meilisearch', () => {
    expect(missingSettings({ BDB_USER: 'u', BDB_PASSWORD: 'p' })).toEqual(['MEILI_HOST']);
  });
});

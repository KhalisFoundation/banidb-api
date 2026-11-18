import { readFileSync } from 'node:fs';
import type { PoolConfig } from 'mariadb';

// Environment variables keep the names the old API used, so existing
// deployments work unchanged:
//
//   BDB_USER, BDB_PASSWORD, BDB_DATABASE
//   BDB_HOST + BDB_PORT for one server, or DB_NODES (JSON array of
//   { host, port?, isPrimary? }) for a cluster; DB_POOL_SIZE (default 10);
//   SSL_CA (path to a CA file).
//   MEILI_HOST, MEILI_API_KEY: Meilisearch, for auto-detect search (searchtype 8).
//   Port 3001 when NODE_ENV=development, 3000 otherwise; PORT overrides both.
//   TRUST_PROXY: Express "trust proxy" (hops in front of the app), default 1.

type Env = Record<string, string | undefined>;

export interface DbNode {
  host: string;
  port?: number;
  isPrimary?: boolean;
}

export interface AppConfig {
  port: number;
  trustProxy: number;
  db: PoolConfig[];
  meili: { host: string; apiKey?: string } | null;
}

// Driver options that keep mariadb 3 returning what mariadb 2 did, so JSON
// responses don't change: numbers for DECIMAL and BIGINT (COUNT(*)), dates as
// strings, JSON columns as text (the mappers parse them).
const driverCompat: Partial<PoolConfig> = {
  dateStrings: true,
  decimalAsNumber: true,
  bigIntAsNumber: true,
  insertIdAsNumber: true,
  checkDuplicate: false,
  autoJsonMap: false,
};

// Replicas in a cluster keep a small idle pool; the primary takes the main load.
const standby: Partial<PoolConfig> = { minimumIdle: 2 };

const int = (value: string | undefined, fallback: number) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isNaN(n) ? fallback : n;
};

function poolConfigs(env: Env): PoolConfig[] {
  const base: PoolConfig = {
    ...driverCompat,
    acquireTimeout: 6000,
    compress: true,
    user: env.BDB_USER || 'root',
    password: env.BDB_PASSWORD || 'root',
    database: env.BDB_DATABASE,
    connectionLimit: int(env.DB_POOL_SIZE, 10),
  };
  if (env.SSL_CA) base.ssl = { ca: readFileSync(env.SSL_CA, 'utf8') };
  // MySQL 8's default login (caching_sha2_password) needs the server's RSA key
  // when the connection isn't TLS; without this, logging in fails.
  else base.allowPublicKeyRetrieval = true;

  if (env.DB_NODES) {
    return (JSON.parse(env.DB_NODES) as DbNode[]).map((node) => ({
      ...base,
      ...(node.isPrimary ? {} : standby),
      host: node.host,
      port: node.port || 3306,
    }));
  }
  return [{ ...base, host: env.BDB_HOST || 'localhost', port: int(env.BDB_PORT, 3306) }];
}

export function loadConfig(env: Env = process.env): AppConfig {
  return {
    port: int(env.PORT, env.NODE_ENV === 'development' ? 3001 : 3000),
    trustProxy: int(env.TRUST_PROXY, 1),
    db: poolConfigs(env),
    meili: env.MEILI_HOST ? { host: env.MEILI_HOST, apiKey: env.MEILI_API_KEY } : null,
  };
}

// Settings the old API silently defaulted (root/root) or needs for a feature.
export function missingSettings(env: Env = process.env): string[] {
  return ['BDB_USER', 'BDB_PASSWORD', 'MEILI_HOST'].filter((key) => !env[key]);
}

export const APP_CONFIG = Symbol('APP_CONFIG');

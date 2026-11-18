import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPool, createPoolCluster, type PoolConfig } from 'mariadb';
import { APP_CONFIG, type AppConfig } from '../config/config';

export type Row = Record<string, any>;

interface Queryable {
  query<T>(sql: string, values?: unknown[]): Promise<T>;
}

// The BaniDB database: one server → a pool; several → a cluster that tries
// the nodes in order.
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly queryable: Queryable;
  private readonly end: () => Promise<void>;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    const configs: PoolConfig[] = config.db;
    if (configs.length > 1) {
      const cluster = createPoolCluster();
      configs.forEach((node) => cluster.add(String(node.host), node));
      this.queryable = cluster.of(null, 'ORDER');
      this.end = () => cluster.end();
    } else {
      const pool = createPool(configs[0]);
      this.queryable = pool;
      this.end = () => pool.end();
    }
  }

  query<T = Row>(sql: string, values: unknown[] = []): Promise<T[]> {
    return this.queryable.query<T[]>(sql, values);
  }

  async onModuleDestroy() {
    await this.end();
  }
}

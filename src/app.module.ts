import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AmritKeertanController } from './amritkeertan/amritkeertan.controller';
import { AppController } from './app.controller';
import { BanisModule } from './banis/banis.module';
import { CacheControlInterceptor } from './common/cache-control';
import { AllExceptionsFilter } from './common/exception.filter';
import { DatabaseModule } from './database/database.module';
import { GraphqlModule } from './graphql/graphql.module';
import { HealthController } from './health/health.controller';
import { KoshController } from './kosh/kosh.controller';
import { MetadataController } from './metadata/metadata.controller';
import { RehatsController } from './rehats/rehats.controller';
import { ShabadsModule } from './shabads/shabads.module';

@Module({
  imports: [
    DatabaseModule,
    // Per client IP; each route sets its own limit (common/throttle.ts).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    ShabadsModule,
    BanisModule,
    GraphqlModule,
  ],
  controllers: [
    AppController,
    HealthController,
    AmritKeertanController,
    KoshController,
    RehatsController,
    MetadataController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: CacheControlInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { loadConfig, missingSettings } from './config/config';
import { setupDocs } from './docs/openapi';

export function configureApp(app: NestExpressApplication, trustProxy: number) {
  // Behind the proxy: take the client IP (rate limits) from X-Forwarded-For.
  app.set('trust proxy', trustProxy);
  // Query strings parse as they did on Express 4 (`?a[b]=1` is an object).
  app.set('query parser', 'extended');
  app.disable('x-powered-by');
  // Responses differ by origin only in their CORS headers; caches keep that apart.
  app.use((req: { url: string }, res: { vary(field: string): void }, next: () => void) => {
    res.vary('Origin');
    // The old API also answered /v2//shabads/1 (one extra slash after /v2).
    req.url = req.url.replace(/^\/v2\/\//i, '/v2/');
    next();
  });
  app.enableCors();
  app.setGlobalPrefix('v2');
  app.enableShutdownHooks();
  setupDocs(app);
}

async function bootstrap() {
  // Local development: settings from .env (never overrides the real environment).
  try {
    process.loadEnvFile();
  } catch {
    // no .env
  }
  const logger = new Logger('Bootstrap');
  const config = loadConfig();
  const missing = missingSettings();
  if (missing.length) logger.warn(`Not set: ${missing.join(', ')}`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app, config.trustProxy);
  await app.listen(config.port, '0.0.0.0');
  logger.log(`BaniDB API start on port ${config.port}`);
}

if (require.main === module) void bootstrap();

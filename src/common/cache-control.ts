import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';

// Gurbani changes rarely, so responses are cacheable for 6 hours, as before.
// The hukamnama changes daily (30 minutes) and /random every time. Errors
// aren't cached (see the exception filter).
export const CACHEABLE = 'max-age=21600';
export const NOT_CACHEABLE = 'no-cache,max-age=0';

const CACHE_CONTROL = 'cache-control';

export const CacheFor = (seconds: number) => SetMetadata(CACHE_CONTROL, `max-age=${seconds}`);
export const NoCache = () => SetMetadata(CACHE_CONTROL, NOT_CACHEABLE);

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const value = this.reflector.getAllAndOverride<string>(CACHE_CONTROL, [
      context.getHandler(),
      context.getClass(),
    ]);
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Cache-Control', value ?? CACHEABLE);
    return next.handle();
  }
}

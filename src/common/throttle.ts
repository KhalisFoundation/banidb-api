import { applyDecorators } from '@nestjs/common';
import { ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

// Requests per client IP per minute, per route: 100, or 250 for search and health.
const limit = (perMinute: number) => () =>
  applyDecorators(
    Throttle({ default: { limit: perMinute, ttl: 60_000 } }),
    ApiTooManyRequestsResponse({
      description: `More than ${perMinute} requests in a minute from one IP address.`,
      content: { 'text/html': { schema: { type: 'string', example: 'Too Many Requests' } } },
    }),
  );
export const Limit100 = limit(100);
export const Limit250 = limit(250);

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiError } from './api-error';
import { NOT_CACHEABLE } from './cache-control';

// Turns every failure into the response shapes the old API used:
//   ApiError        → { error: true, data: { error: message } } with its status
//   unknown route   → 404 { url: '<path> not found' }
//   rate limited    → 429 'Too Many Requests' (plain text)
//   anything else   → 500 { error: true, data: { error: 'Internal server error' } }
// Unlike before, a 500 never carries the error object, SQL or stack trace;
// those go to the log.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Error');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    if (res.headersSent) {
      this.logger.error(
        `${req.method} ${req.originalUrl} (after the response started)`,
        stack(exception),
      );
      return;
    }
    res.setHeader('Cache-Control', NOT_CACHEABLE);

    if (exception instanceof ApiError) {
      res.status(exception.status).json({ error: true, data: { error: exception.message } });
      return;
    }

    if (exception instanceof HttpException) {
      const status: number = exception.getStatus();
      if (status === 404) {
        res.status(status).json({ url: `${req.originalUrl} not found` });
        return;
      }
      if (status === 429) {
        res.status(status).type('text/html').send('Too Many Requests');
        return;
      }
      if (status < 500) {
        res.status(status).json({ error: true, data: { error: exception.message } });
        return;
      }
    }

    this.logger.error(`${req.method} ${req.originalUrl}`, stack(exception));
    res.status(500).json({ error: true, data: { error: 'Internal server error' } });
  }
}

const stack = (exception: unknown) =>
  exception instanceof Error ? (exception.stack ?? exception.message) : String(exception);

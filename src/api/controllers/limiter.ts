import * as e from 'express';
import { RateLimiter } from 'limiter';
import cache from 'memory-cache';

const isLimited = (req: e.Request, res: e.Response, next: e.NextFunction, rate: any) => {
  if (cache.get(req.ip)) {
    const cachedLimiter = cache.get(req.ip);
    if (cachedLimiter.getTokensRemaining() > 1) {
      cachedLimiter.removeTokens(1, () => {});
      cache.put(req.ip, cachedLimiter, 10000);
      return next();
    }
    return res.status(429).send('Too Many Requests');
  }
  const cachedLimiter = new RateLimiter(rate, 'minute');
  cache.put(req.ip, cachedLimiter, 10000);
  return next();
};

export const rate250 = (req: e.Request, res: e.Response, next: e.NextFunction) =>
  isLimited(req, res, next, 250);
export const rate100 = (req: e.Request, res: e.Response, next: e.NextFunction) =>
  isLimited(req, res, next, 100);

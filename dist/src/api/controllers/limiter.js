'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const limiter_1 = require('limiter');
const memory_cache_1 = __importDefault(require('memory-cache'));
const isLimited = (req, res, next, rate) => {
  if (memory_cache_1.default.get(req.ip)) {
    const cachedLimiter = memory_cache_1.default.get(req.ip);
    if (cachedLimiter.getTokensRemaining() > 1) {
      cachedLimiter.removeTokens(1, () => {});
      memory_cache_1.default.put(req.ip, cachedLimiter, 10000);
      return next();
    }
    return res.status(429).send('Too Many Requests');
  }
  const cachedLimiter = new limiter_1.RateLimiter(rate, 'minute');
  memory_cache_1.default.put(req.ip, cachedLimiter, 10000);
  return next();
};
exports.rate250 = (req, res, next) => isLimited(req, res, next, 250);
exports.rate100 = (req, res, next) => isLimited(req, res, next, 100);

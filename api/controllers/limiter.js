const { RateLimiter } = require('limiter');
const cache = require('memory-cache');

const isLimited = (req, res, next, rate) => {
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

module.exports = {
  rate250: (req, res, next) => isLimited(req, res, next, 250),
  rate100: (req, res, next) => isLimited(req, res, next, 100),
};

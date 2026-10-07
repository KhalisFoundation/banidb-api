const { RateLimiter } = require('limiter');
const cache = require('memory-cache');

const isLimited = (req, res, next, rate) => {
  let cachedLimiter = cache.get(req.ip);
  if (!cachedLimiter) {
    // limiter v2: constructor takes { tokensPerInterval, interval }
    cachedLimiter = new RateLimiter({ tokensPerInterval: rate, interval: 'minute' });
    cache.put(req.ip, cachedLimiter, 10000);
  }
  // tryRemoveTokens is sync and returns true if a token was consumed
  if (cachedLimiter.tryRemoveTokens(1)) {
    return next();
  }
  return res.status(429).send('Too Many Requests');
};

module.exports = {
  rate250: (req, res, next) => isLimited(req, res, next, 250),
  rate100: (req, res, next) => isLimited(req, res, next, 100),
};

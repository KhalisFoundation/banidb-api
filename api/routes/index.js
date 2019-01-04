const os = require('os');
const { Router } = require('express');
const limiter = require('../controllers/limiter');
const pjson = require('../../package.json');
const shabads = require('../controllers/shabads');
const banis = require('../controllers/banis');
const rehats = require('../controllers/rehats');

const route = Router();

route.get('/', limiter.rate100, (req, res) => {
  res.json({
    name: 'BaniDB API',
    docs: 'See https://www.banidb.com for more information and documentation.',
    version: pjson.version,
    endpoint: os.hostname().substr(0, 3)
  });
});

// Shabad Routes
route.get('/search/:query', limiter.rate250, shabads.search);

route.get('/shabads/:ShabadID', limiter.rate100, shabads.shabads);

route.get('/angs/:PageNo/:SourceID?', limiter.rate100, shabads.angs);

route.get('/hukamnamas/:year?/:month?/:day?', limiter.rate100, shabads.hukamnamas);

route.get('/random/:SourceID?', limiter.rate100, shabads.random);

// Bani Routes
route.get('/banis', limiter.rate100, banis.all);

route.get('/banis/:BaniID', limiter.rate100, banis.bani);

// Rehat Routes
route.get('/rehats', limiter.rate100, rehats.all);

route.get('/rehats/:RehatID', limiter.rate100, rehats.chapterList);

route.get('/rehats/:RehatID/chapters/:ChapterID?', limiter.rate100, rehats.chapters);

route.get('/rehats/search/:string', limiter.rate250, rehats.search);

module.exports = route;

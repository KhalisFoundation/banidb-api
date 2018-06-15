const os = require('os');
const { Router } = require('express');
const pjson = require('../../package.json');
const shabads = require('../controllers/shabads');
const banis = require('../controllers/banis');
const rehats = require('../controllers/rehats');

const route = Router();

route.get('/', (req, res) => {
  res.json({
    name: 'BaniDB API',
    docs: 'See https://www.banidb.com for more information and documentation.',
    version: pjson.version,
    endpoint: os.hostname().substr(0, 3)
  });
});

// Shabad Routes
route.get('/search/:query', shabads.search);

route.get('/shabads/:ShabadID', shabads.shabads);

route.get('/angs/:PageNo/:SourceID?', shabads.angs);

route.get('/hukamnamas/:year?/:month?/:day?', shabads.hukamnamas);

route.get('/random/:SourceID?', shabads.random);

// Bani Routes
route.get('/banis', banis.all);

route.get('/banis/:BaniID', banis.bani);

// Rehat Routes
route.get('/rehats', rehats.all);

route.get('/rehats/:RehatID', rehats.chapterList);

route.get('/rehats/:RehatID/chapters/:ChapterID?', rehats.chapters);

route.get('/rehats/search/:string', rehats.search);

module.exports = route;

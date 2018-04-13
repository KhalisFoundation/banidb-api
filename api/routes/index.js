const os = require('os');
const pjson = require('../../package.json');
const shabads = require('../controllers/shabads');
const banis = require('../controllers/banis');
const rehats = require('../controllers/rehats');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.json({
      name: 'BaniDB API',
      docs: 'See https://www.banidb.com for more information and documentation.',
      version: pjson.version,
      endpoint: os.hostname().substr(0, 3),
    });
  });

  // Shabad Routes
  app.get('/search/:query', shabads.search);

  app.get('/shabads/:ShabadID', shabads.shabads);

  app.get('/angs/:PageNo/:SourceID?', shabads.angs);

  app.get('/hukamnamas/:year?/:month?/:day?', shabads.hukamnamas);

  app.get('/random/:SourceID?', shabads.random);

  // Bani Routes
  app.get('/banis', banis.all);

  app.get('/banis/:BaniID', banis.bani);

  // Rehat Routes
  app.get('/rehats', rehats.all);

  app.get('/rehats/:RehatID', rehats.chapterList);

  app.get('/rehats/:RehatID/chapters/:ChapterID?', rehats.chapters);

  app.get('/rehats/search/:string', rehats.search);
};

'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const os_1 = __importDefault(require('os'));
const package_json_1 = __importDefault(require('../../../package.json'));
const amritkeertan = __importStar(require('../controllers/amritkeertan'));
const banis = __importStar(require('../controllers/banis'));
const healthcheck = __importStar(require('../controllers/healthcheck'));
const kosh = __importStar(require('../controllers/kosh'));
const limiter = __importStar(require('../controllers/limiter'));
const rehats = __importStar(require('../controllers/rehats'));
const shabads = __importStar(require('../controllers/shabads'));
const route = express_1.Router();
route.get('/', limiter.rate100, (req, res) => {
  res.json({
    name: 'BaniDB API',
    version: package_json_1.default.version,
    documentation: 'https://www.banidb.com',
    'terms-of-service': 'https://www.banidb.com/tos',
    'data-license': 'http://www.banidb.com/nposl',
    endpoint: os_1.default.hostname().substr(0, 3),
  });
});
// Healthcheck Routes
route.get('/health', limiter.rate250, healthcheck.db);
// Shabad Routes
route.get('/search/:query', limiter.rate250, shabads.search);
route.get('/shabads/:ShabadID', limiter.rate100, shabads.shabads);
route.get('/angs/:PageNo/:SourceID?', limiter.rate100, shabads.angs);
route.get('/hukamnamas/:year?/:month?/:day?', limiter.rate100, shabads.hukamnamas);
route.get('/random/:SourceID?', limiter.rate100, shabads.random);
// Bani Routes
route.get('/banis', limiter.rate100, banis.all);
route.get('/banis/:BaniID', limiter.rate100, banis.bani);
// Amrit Keertan Routes
route.get('/amritkeertan', limiter.rate100, amritkeertan.headers);
route.get('/amritkeertan/index', limiter.rate100, amritkeertan.index);
route.get('/amritkeertan/index/:HeaderID', limiter.rate100, amritkeertan.index);
route.get('/amritkeertan/shabads/:ShabadID', limiter.rate100, amritkeertan.shabad);
// Kosh Routes
route.get('/kosh/:Letter', limiter.rate100, kosh.letter);
route.get('/kosh/word/:Word', limiter.rate100, kosh.word);
route.get('/kosh/search/:query', limiter.rate100, kosh.search);
// Rehat Routes
route.get('/rehats', limiter.rate100, rehats.all);
route.get('/rehats/:RehatID', limiter.rate100, rehats.chapterList);
route.get('/rehats/:RehatID/chapters/:ChapterID?', limiter.rate100, rehats.chapters);
route.get('/rehats/search/:string', limiter.rate250, rehats.search);
exports.default = route;

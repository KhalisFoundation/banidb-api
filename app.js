const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cacheControl = require('express-cache-controller');
const { createPool, createPoolCluster } = require('mariadb');
const swaggerUi = require('swagger-ui-express');

const config = require('./api/config');
const routes = require('./api/routes');
const swaggerDocument = require('./swagger.json');

swaggerDocument.servers[0].url =
  process.env.NODE_ENV === 'development'
    ? 'https://api.khajana.org/v2/'
    : 'https://api.banidb.com/v2';

const app = express();
const port = process.env.NODE_ENV === 'development' ? '3001' : '3000';

// database
if (config.length > 1) {
  const dbCluster = createPoolCluster();
  config.forEach(dbConfig => dbCluster.add(dbConfig.host, dbConfig));
  app.locals.pool = dbCluster.of(/.*?/, 'ORDER');
} else {
  app.locals.pool = createPool(config[0]);
}

// app
app.use(cors());
app.use(cacheControl({ maxAge: 21600 }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/v2', routes);
app.use('/v2/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  res.cacheControl = { noCache: true };
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

app.listen(port, () => {
  console.log(`BaniDB API start on port ${port}`);
});

module.exports = app;

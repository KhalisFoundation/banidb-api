const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cacheControl = require('express-cache-controller');
const { createPool } = require('mariadb');
const config = require('./api/config');
const routes = require('./api/routes');

const app = express();
const port = process.env.NODE_ENV === 'development' ? '3001' : '3000';

//database
try {
  app.locals.pool = createPool(config.mysql0);
} catch (err) {
  try {
    app.locals.pool = createPool(config.mysql1);
  } catch (err) {
    try {
      app.locals.pool = createPool(config.mysql2);
    } catch (err) {
      try {
        app.locals.pool = createPool(config.mysql3);
      } catch (err) {
        console.log('Could not connect to any database!');
        console.log(err);
      }
    }
  }
}

// app
app.use(cors());
app.use(cacheControl({ maxAge: 21600 }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/v2', routes);

app.use((req, res) => {
  res.cacheControl = { noCache: true };
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

app.listen(port, () => {
  console.log(`BaniDB API start on port ${port}`);
});

module.exports = app;

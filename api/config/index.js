const fs = require('fs');

/**
 * Expects process-dev.json or process.json (or run local)
 *
 * @example
 *
 * {
 *    "name" : "banidb",
 *    "script" : "app.js",
 *    "env": {
 *        "NODE_ENV": "development|production",
 *        "DB_USER": "",
 *        "DB_PASSWORD": "",
 *        "DB_POOL_SIZE": 5,
 *        "SSL_CA": "/Downloads/aws_skysql_chain.pem",
 *        // single endpoint, use:
 *        "DB_HOST": "dba.contoso.net",
 *        "DB_PORT": 5001
 *        // if you are using a write anywhere cluster, use DB_NODES:
 *        "DB_NODES": [
 *          {
 *            "host": "localhost",
 *            "port": 3306,
 *            "isPrimary": true,
 *          },
 *          {
 *            "host": "dba.contoso.net",
 *          },
 *          {
 *            "host": "dbb.contoso.net",
 *          },
 *        ],
 *    },
 *    "error_file": "err.log",
 *    "out_file": "out.log",
 *    "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
 * }
 */

const metadata = {
  user: process.env.DB_USER || process.env.DBUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.DBPASSWORD || 'root',
  database: process.env.DBNAME,
  dateStrings: true,
  compress: true,
  acquireTimeout: 6000,
  connectionLimit: process.env.DB_POOL_SIZE,
};

if (process.env.SSL_CA) {
  metadata.ssl = { ca: fs.readFileSync(process.env.SSL_CA, 'utf8') };
}

const standbyMetadata = {
  minimumIdle: 2,
};

// everything below is to pull from process.json
const configArry = [];

// if npm run local, then just define what cli gives, otherwise use process.json
if (!!process.env.DB_NODES) {
  const dbs = JSON.parse(process.env.DB_NODES);
  dbs.forEach(db => {
    const thisObj = {
      ...metadata,
      host: db.host,
      port: db.port || 3306,
    };
    if (!!db.isPrimary) {
      configArry.push(thisObj);
    } else {
      configArry.push({
        ...thisObj,
        ...standbyMetadata,
      });
    }
  });
} else {
  configArry.push({
    ...metadata,
    host: process.env.DB_HOST || process.env.DBHOST || 'localhost',
    port: process.env.DB_PORT || process.env.DBPORT || 3306,
  });
}

module.exports = configArry;

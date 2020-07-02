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
 **/

const metadata = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.NODE_ENV === 'development' ? 'khajana_dev_khajana' : 'khajana_khajana',
  dateStrings: true,
  acquireTimeout: 5000,
  connectionLimit: process.env.DB_POOL_SIZE,
};
const standbyMetadata = {
  minimumIdle: 0,
};

// everything below is to pull from process.json
const configArry = [];

// if npm run local, then just define what cli gives, otherwise use process.json
if (!!process.env['DB_NODES']) {
  const dbs = JSON.parse(process.env.DB_NODES);
  dbs.forEach(db => {
    const thisObj = {
      ...metadata,
      host: db.host,
      port: db.port || 3306,
    };
    if (!!db.isPrimary && db.isPrimary === true) {
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
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
  });
}

module.exports = configArry;

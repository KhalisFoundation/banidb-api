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
const configObj = {};

// if npm run local, then just define what cli gives, otherwise use process.json
if (Object.prototype.hasOwnProperty.call(process.env, 'DB_NODES')) {
  const dbs = JSON.parse(process.env.DB_NODES);
  Object.keys(dbs).forEach(dbname => {
    const thisObj = {
      ...metadata,
      host: dbs[dbname].host,
      port: dbs[dbname].port || 3306,
    };
    if (
      Object.prototype.hasOwnProperty.call(dbs[dbname], 'isPrimary') &&
      dbs[dbname].isPrimary === true
    ) {
      configObj[dbname] = thisObj;
    } else {
      configObj[dbname] = {
        ...thisObj,
        ...standbyMetadata,
      };
    }
  });
} else {
  configObj.local = {
    ...metadata,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
  };
}
module.exports = configObj;

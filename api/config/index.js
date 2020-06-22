const metadata = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.NODE_ENV === 'development' ? 'khajana_dev_khajana' : 'khajana_khajana',
  dateStrings: true,
  acquireTimeout: 5000,
  connectionLimit: process.env.DB_POOL_SIZE,
};
const standbyMetadata = {
  port: 3306,
  minimumIdle: 0,
};

module.exports = {
  mysql0: {
    ...metadata,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
  },
  mysql1: {
    ...metadata,
    ...standbyMetadata,
    host: 'db1.khalis.net',
  },
  mysql2: {
    ...metadata,
    ...standbyMetadata,
    host: 'db2.khalis.net',
  },
  mysql3: {
    ...metadata,
    ...standbyMetadata,
    host: 'db3.khalis.net',
  },
};

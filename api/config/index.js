module.exports = {
  mysql: {
    host: '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.NODE_ENV === 'development' ? 'khajana_dev_khajana' : 'khajana_khajana',
    dateStrings: true,
    connectionLimit: process.env.DB_POOL_SIZE,
  },
};

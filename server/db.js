// /server/db.js
const sql = require('mssql');

const config = {
    user: 'edu_app_user',
    password: 'Password123',
    server: 'localhost',
    options: {
        instanceName: 'SQLEXPRESS02',
        encrypt: false,
        trustServerCertificate: true
    },
    database: 'EduLedgerDB',
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅✅✅ KẾT NỐI DATABASE THÀNH CÔNG!!! ✅✅✅');
    return pool;
  })
  .catch(err => {
      console.error('--- LỖI KẾT NỐI DATABASE NGHIÊM TRỌNG ---');
      console.error(err);
      return Promise.reject(err);
  });

module.exports = {
  sql, poolPromise
};
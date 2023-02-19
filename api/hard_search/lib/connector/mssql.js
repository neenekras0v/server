const sql = require('mssql');

const timeout = 120_000_000;

const connectDB = {
  user: 'u0538065_ivan',
  password: 'A2^8plr34',
  database: 'u0538065_prm',
  server: '37.140.192.136',
  options: {
    encrypt: false,
  },
};

async function loadMssql(querySQL) {
  const items = await sql
    .connect(connectDB)
    .then(() => {
      // console.log(querySQL);
      return sql.query(querySQL);
    })
    .then((result) => {
      // console.log(result);
      return result.recordset;
    })
    .catch((err) => {
      console.dir(err);
    });

  sql.on('error', (err) => {
    console.dir(err);
  });

  return items;
}

module.exports = loadMssql;

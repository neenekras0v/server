const loadMssql = require('../connector/mssql');

async function personalList() {
  let querySQL = `SELECT * FROM dbo.PersonalModels WHERE dbo.PersonalModels.PeriodWork != '3' and dbo.PersonalModels.PeriodWork != '6'
  `;

  let list = await loadMssql(querySQL);
  return list;
}

module.exports = personalList;

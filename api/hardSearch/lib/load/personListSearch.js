const loadMssql = require('../connector/mssql');

async function personListSearch(search) {
  let querySQL = `SELECT PersonalModels.name, PersonalModels.Id FROM dbo.PersonalModels WHERE dbo.PersonalModels.PeriodWork != '3' and dbo.PersonalModels.PeriodWork != '6' and dbo.PersonalModels.name LIKE '%${search}%' OR dbo.PersonalModels.phone LIKE '%${search}%'
  `;

  let list = await loadMssql(querySQL);
  return list;
}

module.exports = personListSearch;

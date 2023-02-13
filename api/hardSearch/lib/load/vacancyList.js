const loadMssql = require('../connector/mssql');

async function vacancyList() {
  let querySQL = `
  SELECT dbo.PostModels.Id as id, dbo.PostModels.Post as name FROM dbo.PostModels
     `;

  let list = await loadMssql(querySQL);
  return list;
}

module.exports = vacancyList;

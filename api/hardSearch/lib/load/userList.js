const loadMssql = require('../connector/mssql');

async function userList() {
  let querySQL = `
  SELECT dbo.UserProfile.FIO as name, dbo.UserProfile.UserId as id FROM dbo.UserProfile
     `;

  let list = await loadMssql(querySQL);
  return list;
}

module.exports = userList;

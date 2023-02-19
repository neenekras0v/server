const loadMssql = require('../connector/mssql');

async function personProfile(id) {
  let querySQL = `SELECT * FROM dbo.PersonalModels WHERE dbo.PersonalModels.Id = '${id}'
  `;

  let person = await loadMssql(querySQL);

  return person;
}

module.exports = personProfile;

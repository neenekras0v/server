const loadMssql = require('../connector/mssql');

async function workList(dateStart, dateEnd, id) {
  let querySQL = `SELECT dbo.WorkLists.WorkListId, dbo.WorkLists.PostModelId, dbo.WorkPersons.Date, dbo.WorkLists.Address, dbo.WorkLists.After, dbo.WorkLists.Before, dbo.WorkPersons.call, dbo.WorkPersons.WorkPersonId, dbo.PersonalModels.Id, dbo.PersonalModels.name, dbo.PersonalModels.phone, dbo.CommentsLists.Count, dbo.WorkLists.Notes FROM dbo.WorkPersons, dbo.WorkLists, dbo.PersonalModels, dbo.CommentsLists WHERE CAST(dbo.WorkPersons.Date as datetime) between '${dateStart}' and '${dateEnd}' AND dbo.WorkPersons.WorkListId = dbo.WorkLists.WorkListId and dbo.WorkPersons.PersonalModelId = dbo.PersonalModels.Id and dbo.WorkPersons.CommentId = dbo.CommentsLists.CommentId and dbo.CommentsLists.Count > 0
     `;

  if (id) {
    querySQL = `SELECT dbo.WorkLists.WorkListId, dbo.WorkLists.PostModelId, dbo.WorkPersons.Date, dbo.WorkLists.Address, dbo.WorkLists.After, dbo.WorkLists.Before, dbo.WorkPersons.call, dbo.WorkPersons.WorkPersonId, dbo.PersonalModels.Id, dbo.PersonalModels.name, dbo.PersonalModels.phone, dbo.CommentsLists.Count, dbo.WorkLists.Notes FROM dbo.WorkPersons, dbo.WorkLists, dbo.PersonalModels, dbo.CommentsLists WHERE CAST(dbo.WorkPersons.Date as datetime) between '${dateStart}' and '${dateEnd}' AND dbo.WorkPersons.WorkListId = dbo.WorkLists.WorkListId and dbo.WorkPersons.PersonalModelId = dbo.PersonalModels.Id and dbo.WorkPersons.CommentId = dbo.CommentsLists.CommentId and dbo.CommentsLists.Count > 0 and dbo.PersonalModels.Id = ${id}
    `;
  }

  let list = await loadMssql(querySQL);

  return list;
}

module.exports = workList;

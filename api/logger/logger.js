const axios = require('axios');
const personalOne = require('../hardSearch/lib/load/personProfile');

async function logger(id, event, text) {
  let token = '5549539765:AAFh_XU_fGgaAk0WyTmHXpX6e7-14yapxz8';
  let groupId = '-1001837205041';

  if (id) {
    let personal = await personalOne(id);
    text = personal[0].Name + ' => ' + text;
  }

  let message = '#' + event + ' => ' + text;

  const options = {
    method: 'POST',
    url: 'https://api.telegram.org/bot' + token + '/sendMessage',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    data: {
      text: message,
      chat_id: groupId,
    },
  };

  await axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.error(error);
    });

  return message;
}

module.exports = logger;

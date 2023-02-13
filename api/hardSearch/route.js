const router = require('express').Router();

const { person, resultPerson } = require('./lib/person');
const resultFilter = require('./lib/filter');

const workList = require('./lib/load/workList');

const personListSearch = require('./lib/load/personListSearch');

const logger = require('../logger/logger');

const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const redisClient = require('./lib/connector/redis');

router.get('/stop', async (req, res) => {
  let { id, ex } = req.query;

  await redisClient.set('stopList:' + String(id), String(id), {
    EX: Number(ex),
    NX: true,
  });

  let stopList = [];

  for await (const key of redisClient.scanIterator({
    TYPE: 'string',
    MATCH: 'stopList' + '*',
    COUNT: 1000,
  })) {
    let value = await redisClient.get(key);
    stopList.push(value);
  }

  res.status(200).json({ stopList });
});

router.get('/rating', async (req, res) => {
  let { id, num } = req.query;

  let rating = await redisClient.get('rating:' + String(id));

  if (!rating) {
    rating = 5.0;
  }

  if (!num) {
    return res.status(200).json({ rating: Number(rating) });
  }

  let sum = Number(rating) + Number(num);

  await redisClient.set('rating:' + String(id), sum.toFixed(1));

  res.status(200).json({ rating: sum.toFixed(1) });
});

router.get('/comment', async (req, res) => {
  let { id, event, text } = req.query;

  let date = moment().tz('Asia/Yekaterinburg').format('DD.MM.YYYY HH:mm');
  let commentId = uuidv4();

  let comments = [];

  let comment = {
    event,
    text,
    date,
  };

  if (text) {
    await redisClient.set(
      'comment' + String(id) + ':' + commentId,
      JSON.stringify(comment),
      {
        EX: Number(moment.duration('23:59', 'HH:mm').asSeconds()),
        NX: true,
      }
    );

    await logger(id, event, text);
  }

  for await (const key of redisClient.scanIterator({
    TYPE: 'string',
    MATCH: 'comment' + String(id) + ':' + '*',
    COUNT: 1000,
  })) {
    let value = await redisClient.get(key);
    value = JSON.parse(value);
    comments.push(value);
  }

  res.status(200).json(comments);
});

router.get('/person-next', async (req, res) => {
  try {
    let Filter = await resultFilter();

    await redisClient.set(
      'stopList:' + String(Filter.user.id),
      String(Filter.user.id),
      {
        EX: Number(900),
        NX: true,
      }
    );

    return res.status(200).json({ status: 'ok', payload: Filter });
  } catch (error) {
    res.status(500).json({ status: 'bad', error: error.message });
  }
});

router.get('/person', async (req, res) => {
  try {
    let { id, dateStart, dateEnd } = req.query;

    if (!id) {
      return res.status(404).json({ status: 'bad' });
    }

    let Person = await resultPerson(id, dateStart, dateEnd);

    return res.status(200).json({ status: 'ok', payload: { user: Person } });
  } catch (error) {
    res.status(500).json({ status: 'bad', error: error.message });
  }
});

router.get('/work-list', async (req, res) => {
  try {
    let dateStart = moment().tz('Asia/Yekaterinburg').format('YYYY-MM-DD');
    let dateEnd = moment()
      .tz('Asia/Yekaterinburg')
      .add(2, 'day')
      .format('YYYY-MM-DD');

    let result = await workList(dateStart, dateEnd);

    return res.status(200).json({ status: 'ok', payload: result });
  } catch (error) {
    res.status(500).json({ status: 'bad', error: error.message });
  }
});

router.get('/person-list', async (req, res) => {
  try {
    let { search } = req.query;

    if (!search) {
      return res.status(404).json({ status: 'bad' });
    }

    let PersonListSearch = await personListSearch(String(search));

    return res.status(200).json({ status: 'ok', payload: PersonListSearch });
  } catch (error) {
    res.status(500).json({ status: 'bad', error: error.message });
  }
});

module.exports = router;

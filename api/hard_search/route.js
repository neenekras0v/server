const router = require('express').Router();

const _ = require('lodash');

const { resultPerson } = require('./lib/person');
const resultFilter = require('./lib/filter');

const workList = require('./lib/load/workList');

const personListSearch = require('./lib/load/personListSearch');

const orderList = require('./lib/load/orderList');

const logger = require('../logger/logger');

const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const redisClient = require('./lib/connector/redis');

router.get('/stop', async (req, res) => {
  let { id, ex } = req.query;

  let isStopList = await redisClient.get('stopList:' + String(id));

  if (isStopList) {
    await redisClient.del('stopList:' + String(id));
  }

  await redisClient.set('stopList:' + String(id), String(id), {
    EX: Number(ex),
    NX: true,
  });

  res.status(200).json({ status: 'OK' });
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

router.get('/not-answer', async (req, res) => {
  try {
    let { id } = req.query;

    console.log(id);

    let todayHour = moment().tz('Asia/Yekaterinburg').format('HH');
    let timeAwait = (24 - Number(todayHour)) * 3600;

    let exTime = 900;

    let value = await redisClient.get('not_answer:' + id);

    if (!value) {
      value = 1;
    }

    if (Number(value) === 1) {
      exTime = 3600;
      value = Number(value) + 1;
    } else if (Number(value) === 2) {
      exTime = 3600 * 2;
      value = Number(value) + 1;
    } else {
      exTime = Number(timeAwait);
    }

    await redisClient.del('not_answer:' + String(id));
    await redisClient.set('not_answer:' + id, Number(value), {
      EX: Number(timeAwait),
      NX: true,
    });

    let isStopList = await redisClient.get('stopList:' + String(id));

    if (isStopList) {
      await redisClient.del('stopList:' + String(id));
    }

    await redisClient.set('stopList:' + String(id), String(id), {
      EX: Number(exTime),
      NX: true,
    });

    return res
      .status(200)
      .json({ status: 'ok', payload: { not_answer: value } });
  } catch (error) {
    res.status(500).json({ status: 'bad', error: error.message });
  }
});

router.get('/comment/add', async (req, res) => {
  try {
    let { id, text } = req.query;

    let uid = uuidv4();

    await redisClient.set(`comment:${id}:${uid}`, String(text), {
      EX: Number(104400),
      NX: true,
    });

    return res.status(200).json({ status: 'ok', payload: text });
  } catch (error) {
    res.status(500).json({ status: 'bad', error: error.message });
  }
});

router.get('/comment', async (req, res) => {
  let { id } = req.query;

  const results = [];
  const iteratorParams = {
    MATCH: 'comment:' + id + ':*',
    COUNT: 100,
  };
  for await (const key of redisClient.scanIterator(iteratorParams)) {
    let value = await redisClient.get(key);
    results.push(value);
  }

  res.status(200).json({ status: 'ok', payload: results });
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
    return res.status(200).json({ status: 'ok', payload: [] });
    // res.status(500).json({ status: 'bad', error: error.message });
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

router.get('/order-list', async (req, res) => {
  try {
    let dateStart = moment()
      .tz('Asia/Yekaterinburg')
      .add(-1, 'day')
      .format('YYYY-MM-DD');

    let dateEnd = moment()
      .tz('Asia/Yekaterinburg')
      .add(3, 'day')
      .format('YYYY-MM-DD');

    let OrderList = await orderList([dateStart, dateEnd]);

    return res.status(200).json({ status: 'ok', payload: OrderList });
  } catch (error) {
    res.status(500).json({ status: 'bad', error: error.message });
  }
});
module.exports = router;

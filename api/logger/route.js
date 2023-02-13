const router = require('express').Router();
const logger = require('./logger');

router.get('/', async (req, res) => {
  let { id, event, text } = req.query;

  if (!id) {
    id = '';
  }
  
  let log = await logger(id, event, text);

  res.status(200).json(log);
});

module.exports = router;

const router = require('express').Router();
const hardSearch = require('./hard_search/route');
const logger = require('./logger/route');

router.use('/lg', logger);
router.use('/hand-search', hardSearch);

module.exports = router;

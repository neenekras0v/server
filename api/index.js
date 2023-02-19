const router = require('express').Router();
const hardSearch = require('./hard_search/route');
const logger = require('./logger/route');
const auth = require('./auth/route');

router.use('/lg', logger);
router.use('/auth', auth);
router.use('/hand-search', hardSearch);

module.exports = router;

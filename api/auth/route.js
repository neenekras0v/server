const router = require('express').Router();
const userList = require('../hard_search/lib/load/userList');

const PrivateKey = 'AAG6nbwcJd5xyEPBdC_pdjGa94VeMCLiXak';

router.get('/', async (req, res) => {
  try {
    let { x } = req.query;

    let status;

    let xSplit = x.split(':');

    let username = xSplit[0];
    let key = xSplit[1];

    let checkUserName = false;
    let checkKey = false;

    let name = '';

    let users = await userList();

    users.map((i) => {
      if (i.username === username) {
        checkUserName = true;
        name = i.name;
      }
    });

    if (key === PrivateKey) {
      checkKey = true;
    }

    if (checkUserName && checkKey) {
      return res.status(200).json({ access: true, name: name });
    }

    return res.status(200).json({ access: false });
  } catch (error) {
    return res.status(200).json({ access: false });
  }
});

module.exports = router;

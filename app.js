require('events').EventEmitter.defaultMaxListeners = 0;

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const api = require('./api');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use('/api/', api);

module.exports = app;

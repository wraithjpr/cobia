'use strict';

var express = require('express');
var app = express();

var router = require('./routes/router.js');
var error = require('./lib/error-handling.js');
var helmet = require('helmet');

const NOT_FOUND = 404;

// Security best practice, see http://expressjs.com/en/advanced/best-practice-security.html
app.use(helmet());

app.use(error.handleRequestError);
app.use(error.handleResponseError);

app.use('/api', router);

app.use(function (req, res) {
  res.sendStatus(NOT_FOUND);
});
app.use(error.logAppError);
app.use(error.handleAppError);

module.exports = app;

'use strict';

var app = require('express')();

var router = require('./routes/router.js');
var error = require('./lib/error-handling.js');
var helmet = require('helmet');
var bodyParser = require('body-parser');
var debug = require('debug')('cobia');

const NOT_FOUND = 404;

// Security best practice, see http://expressjs.com/en/advanced/best-practice-security.html
app.use(helmet());
// for parsing application/json
app.use(bodyParser.json());

app.use(function (req, res, next) {
  debug('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
  debug(`${req.method} ${req.originalUrl}`);
  debug(`headers: ${JSON.stringify(req.headers, null, 2)}`);
  debug(`query: ${JSON.stringify(req.query, null, 2)}`);
  debug(`body: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

app.use(error.handleRequestError);
app.use(error.handleResponseError);

app.use('/api', router);

app.use(function (req, res) {
  res.sendStatus(NOT_FOUND);
});
app.use(error.logAppError);
app.use(error.handleAppError);

module.exports = app;

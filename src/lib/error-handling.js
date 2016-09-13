'use strict';

/** Error handling utilities
 * @module lib/error-handling
 */

const BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;

/**
 * @summary Express application default error handler.
 * @description
 * Use this as a default error handler at the end of an app.js file with Express.
 * If there exists a defined err, then it logs to the console.error and sets the response status to 500 - Internal server error.
 * @example
 * var express = require('express');
 * var app = express();
 * var error = require('./lib/error-handling');
 * ...
 * your apps routes go here
 * ...
 * app.use(error.logAppError);
 * app.use(error.handleAppError);
 *
 * @static
 * @param {Error} err The Error object from Express.
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express.
 * @returns {void}.
 */
function handleAppError (err, req, res) {
  if (err) {
    console.error(err);
    res.sendStatus(INTERNAL_SERVER_ERROR);
  } else {
    console.error('app error handler was invoked but no error exists.');
  }

  return;
}

/**
 * Request level error handler.
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express.
 * @param {Function} next callback function to the next route in Express.
 * @returns {void}.
 */
function handleRequestError (req, res, next) {
  req.on('error', function (err) {
    console.error(err);
    res.statusCode = BAD_REQUEST;
    res.end();
  });
  next();

  return;
}

/**
 * Response level error handler.
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express.
 * @param {Function} next callback function to the next route in Express.
 * @returns {void}.
 */
function handleResponseError (req, res, next) {
  res.on('error', function (err) {
    console.error(err);
  });
  next();

  return;
}

/**
 * @summary Express application error stack trace logger.
 * @description
 * Use this as an error logger at the end of an app.js file with Express.
 * If there exists a defined err, then it logs a stack trace to the console.error.
 * The next() callback is invoked, passing the Error object.
 * @example
 * var express = require('express');
 * var app = express();
 * var error = require('./lib/error-handling');
 * ...
 * your apps routes go here
 * ...
 * app.use(error.logAppError);
 * app.use(error.handleAppError);
 *
 * @static
 * @param {Error} err The Error object from Express.
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express.
 * @param {Function} next callback function to the next route in Express.
 * @returns {void}.
 */
function logAppError (err, req, res, next) {
  if (err) {
    console.error(err.stack);

    return void next(err);
  }

  return void console.error('app error logger was invoked but no error exists.');
}

module.exports.handleAppError = handleAppError;
module.exports.logAppError = logAppError;
module.exports.logError = console.error;
module.exports.handleRequestError = handleRequestError;
module.exports.handleResponseError = handleResponseError;

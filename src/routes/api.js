'use strict';

 /**
  * Cobia REST API module..
  * This module implements the RST API of the Cobia web application.
  * @module routes/api
  * @requires module:model/model
  */

const model = require('../model/model.js');

const debug = require('debug')('cobia');          // eslint-disable-line no-unused-vars

// http status code values
const OK = 200;
const NOT_FOUND = 404;
const NOT_IMPLEMENTED = 501;                    // eslint-disable-line no-unused-vars

// http header content type values
const APPLICATION_JSON = 'application/json';
const TEXT_PLAIN = 'text/plain';

/**
 * @summary **GET /api/hello/**
 * @description
 * Responds with a hello world text string.
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'text/plain'
 * @returns {void}
 */
function getHello (req, res) {
  res.set('Content-Type', TEXT_PLAIN).status(OK).send('Hello World! from the cobia api.');

  return void 0;
}

/**
 * @summary **GET /api/list-items/**
 * @description
 * Responds with a json document containing an array of list items.
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'application/json'
 * @param {Function} next The next() callback for Express.
 * @returns {void}
 */
function getListItems (req, res, next) {
  model.getListItems().then(function (result) {
    if (result.found) {
      res
        .set('Content-Type', APPLICATION_JSON)
        .status(OK)
        .send(JSON.stringify({
          type: result.type,
          count: result.documents.length,
          listItems: result.documents
        }));
    } else {
      res.sendStatus(NOT_FOUND);
    }
  }).catch(function (err) {
    next(err);
  });

  return void 0;
}

module.exports.getHello = getHello;
module.exports.getListItems = getListItems;

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
const INTERNAL_SERVER_ERROR = 500;
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

/**
 * @summary **POST /api/events/**
 * @description
 * Validates a new entry for the Events collection.
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'application/json'
 * @param {Function} next The next() callback for Express.
 * @returns {void}
 */
function validateEvent (req, res, next) {
  try {
    if (!(req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0)) {
      throw new Error('No event document found in the request body.');
    }
    if (!(req.body.dateTime && typeof req.body.dateTime === 'string' && Date.parse(req.body.dateTime))) {
      throw new Error('Request body should have a valid dateTime as a string in ISO 8601 format according to universal time.');
    }
  } catch (err) {
    return void next(err);
  }

  next();

  return void 0;
}

/**
 * @summary **POST /api/events/**
 * @description
 * Constructs a new document for insertion into the Events collection.
 * The new event document is built from req.body and is assigned to res.locals.doc.
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'application/json'
 * @param {Function} next The next() callback for Express.
 * @returns {void}
 */
function buildNewEvent (req, res, next) {
  res.locals.newDoc = Object.assign(
    {},
    req.body,
    { dateTime: new Date(req.body.dateTime) },
    { origin: req.headers.origin }
  );
  next();

  return void 0;
}

/**
 * @summary **POST /api/events/**
 * @description
 * Creates a new entry in the Events collection and responds with a json document containing the new entry's URI.
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'application/json'
 * @param {Function} next The next() callback for Express.
 * @returns {void}
 */
function createEvent (req, res, next) {
  debug(`Creating new event: ${JSON.stringify(res.locals.newDoc, null, 2)}`);
  model.createEvent(res.locals.newDoc).then(function (result) {
    if (result.created) {
      debug(`New event created: ${JSON.stringify(result, null, 2)}`);
      res
        .set('Content-Type', APPLICATION_JSON)
        .status(OK)
        .send(JSON.stringify({
          ack: true,
          count: result.insertedCount,
          uri: `/${result.type}/${result._id}` // eslint-disable-line no-underscore-dangle
        }));
    } else {
      res.sendStatus(INTERNAL_SERVER_ERROR);
    }
  }).catch(function (err) {
    next(err);
  });

  return void 0;
}

module.exports.getHello = getHello;
module.exports.getListItems = getListItems;
module.exports.buildNewEvent = buildNewEvent;
module.exports.createEvent = createEvent;
module.exports.validateEvent = validateEvent;

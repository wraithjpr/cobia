'use strict';

 /**
  * Cobia REST API module..
  * This module implements the RST API of the Cobia web application.
  * @module routes/api
  * @requires module:model/model
  */

const debug = require('debug')('cobia');          // eslint-disable-line no-unused-vars

const transducers = require('transducers-js');

// Polyfills
require('../lib/polyfills.js').arrayIncludes();

// Database access functions
const model = require('../model/model.js');

const VALID_QUERY_TERMS = ['captureType', 'method', 'resourceType'];

// http status code values
const OK = 200;
const NOT_FOUND = 404;
const INTERNAL_SERVER_ERROR = 500;
const NOT_IMPLEMENTED = 501;                    // eslint-disable-line no-unused-vars

// http header content type values
const APPLICATION_JSON = 'application/json';
const TEXT_PLAIN = 'text/plain';

// MongoDB logical operators
const MONGO_EQUALS = '$eq';
const MONGO_AND = '$and';

// Our defaults
const FETCH_SIZE_DEFAULT = 1000;

/**
 * @summary Safety check of query parameters
 * @description
 * Checks the req.query parameters for unsafe terms.
 * For example, the $where term is unsafe because of code injection attacks.
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'application/json'
 * @param {Function} next The next() callback for Express.
 * @returns {void}
 */
function checkQuerySafety (req, res, next) {
  const unsafeTerms = ['$where'];

  try {
    const queryString = req.query ? JSON.stringify(req.query).toLowerCase() : '';
    const safetyChecker = (term) => queryString.indexOf(term) > -1;
    const isUnsafe = unsafeTerms.some(safetyChecker);

    if (isUnsafe) {
      throw new Error('Unsafe query.');
    }
  } catch (err) {
    return void next(err);
  }

  next();

  return void 0;
}

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
 * @summary Builds the cursor query object for MongoDB
 * @description
 * The query object is built from req.query and is assigned to res.locals.queryParams.
 * Uses a transducer to transform. for example:
 * { captureType: 'monitor', method: 'GET', andAnInvalidOne: 'xxx', resourceType: 'main_frame' }
 * to
 * { $and: [{ captureType: { $eq: 'monitor' } }, { method: { $eq: 'GET' } }, { resourceType: { $eq: 'main_frame' } }] }
 * @see {@link http://phuu.net/2014/08/31/csp-and-transducers.html CSP and transducers in JavaScript by Tom Ashworth.}
 * @see {@link https://github.com/cognitect-labs/transducers-js}
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'application/json'
 * @param {Function} next The next() callback for Express.
 * @returns {void}
 */
function buildDbQuery (req, res, next) {
  // Gives us our source collection, for example: ['captureType', 'method', 'andAnInvalidOne', 'resourceType']
  const fetchQueryTermsFromRequest = (request) => Object.keys(request.query);

  // Our filter predicate function
  // Gives us, for example: ['captureType', 'method', 'resourceType']
  const filterer = (validTerms, term) => validTerms.includes(term);
  const filtererCurried = (validTerms) => (term) => filterer(validTerms, term);
  const isValidQueryTerm = filtererCurried(VALID_QUERY_TERMS);

  // Our mapping transform function
  // Gives us, for example: { captureType: { $eq: 'monitor' } }
  const mapper = function (request, term) {
    const condition = {};
    const conditionalValue = {};

    conditionalValue[MONGO_EQUALS] = request.query[term];
    condition[term] = conditionalValue;

    return condition;
  };
  const mapperCurried = (request) => (term) => mapper(request, term);
  const mapTermToCondition = mapperCurried(req);

  // Our reducer builder function
  // Pushes input terms into { '$and': [] }, returning the cursor query object for mongodb.
  const addToCursorQueryObject = function (result, input) {
    // Create the $and, first time round
    result[MONGO_AND] = result[MONGO_AND] || [];
    // Add the input value to the previous result giving the new result
    result[MONGO_AND].push(input);

    return result;
  };

  // Our transducer
  // This looks wrong to me as compose is right to left and we expect to filter first then map.
  // But that gives the filter the mapped result object, so it returns false... I checked in debug.
  // I tried ramda.compose() too... that behaved the same way.
  // So, filter then map, left to right works... I checked it in debug.
  const xf = transducers.comp(
    transducers.filter(isValidQueryTerm),
    transducers.map(mapTermToCondition)
  );

  const transduceCurried = (fetcher) => (transducer) => (builder) => (initial) => (source) => transducers.transduce(transducer, builder, initial, fetcher(source)); // eslint-disable-line max-len
  const buildDbQueryFromRequest = transduceCurried(fetchQueryTermsFromRequest)(xf)(addToCursorQueryObject)({});

  // Finally, do the work...
  // Reduce the query terms using the transducer to build the cursor query object and assign it to res.locals
  res.locals.dbQuery = buildDbQueryFromRequest(req);

  debug(`api.js#buildDbQuery: res.locals.dbQuery is ${JSON.stringify(res.locals.dbQuery, null, 2)}.`);

  next();

  return void 0;
}

/**
* @summary Builds the key or keys set for the sort.
* @description
* The object is assigned to res.locals.queryParams.
* Sorts by dateTime desc, url asc, _id desc.
* @static
* @param {Object} req The request object from Express.
* @param {Object} res The response object from Express. Content-Type is 'application/json'
* @param {Function} next The next() callback for Express.
* @returns {void}
 */
function buildSortCriteria (req, res, next) {
  res.locals.sortCriteria = {
    dateTime: -1,
    url: 1,
    _id: -1
  };
  next();

  return void 0;
}

/**
* @summary Sets up the parameters to control the paging.
* @description
* The res.locals.limit is set to the default page fecth size.
* @static
* @param {Object} req The request object from Express.
* @param {Object} res The response object from Express. Content-Type is 'application/json'
* @param {Function} next The next() callback for Express.
* @returns {void}
 */
function handlePaging (req, res, next) {
  res.locals.limit = FETCH_SIZE_DEFAULT;
  next();

  return void 0;
}

/**
* @summary Sets up the parameters to control field projection for the query.
* @description
* The field projection object is assigned to res.locals.projection.
* @static
* @param {Object} req The request object from Express.
* @param {Object} res The response object from Express. Content-Type is 'application/json'
* @param {Function} next The next() callback for Express.
* @returns {void}
 */
function setupProjection (req, res, next) {
  // res.locals.projection = null;
  // res.locals.projection = {
  //   _id: 1,
  //   captureType: 1,
  //   method: 1,
  //   url: 1,
  //   userEmail: 1,
  //   dateTime: 1,
  //   resourceType: 1
  // };
  res.locals.projection = {
    tabId: 0,
    requestId: 0,
    origin: 0
  };
  next();

  return void 0;
}

/**
 * @summary **GET /api/events/**
 * @description
 * Responds with a json document containing an array of events.
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'application/json'
 * @param {Function} next The next() callback for Express.
 * @returns {void}
 */
function getEvents (req, res, next) {
  model
    .getEvents(res.locals.projection, res.locals.limit, res.locals.sortCriteria, res.locals.dbQuery)
    .then(function (result) {
      debug(`api.js#getEvents: promise is fulfilled: found is ${result.found}, type is ${result.type}, and there are ${result.documents.length} documents.`);
      res.locals.found = result.found;
      res.locals.payload = null;
      if (result.found) {
        res.locals.payload = {
          ack: true,
          type: result.type,
          count: result.documents.length,
          data: result.documents
        };
      }
      next();
    }).catch(function (err) {
      next(err);
    });

  return void 0;
}

/**
 * @summary Sets up the response and sends to the client
 * @description
 * The res.locals.found should be set true and the json document to send should be in res.locals.payload.
 * If none found, then set res.locals.found to false and 404 NOT FOUND will be sent.
 * This method calls end() on the resonse, so no next() call is relevant.
 * @static
 * @param {Object} req The request object from Express.
 * @param {Object} res The response object from Express. Content-Type is 'application/json'
 * @returns {void}
 */
function respond (req, res) {
  if (res.locals.found) {
    if (res.locals.payload && typeof res.locals.payload === 'object' && Object.keys(res.locals.payload).length > 0) {
      res
      .set('Content-Type', APPLICATION_JSON)
      .status(OK)
      .send(JSON.stringify(res.locals.payload))
      .end();
    } else {
      res.sendStatus(INTERNAL_SERVER_ERROR);
    }
  } else {
    res.sendStatus(NOT_FOUND);
  }

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

module.exports.buildNewEvent = buildNewEvent;
module.exports.buildDbQuery = buildDbQuery;
module.exports.buildSortCriteria = buildSortCriteria;
module.exports.checkQuerySafety = checkQuerySafety;
module.exports.createEvent = createEvent;
module.exports.getEvents = getEvents;
module.exports.getHello = getHello;
module.exports.getListItems = getListItems;
module.exports.handlePaging = handlePaging;
module.exports.respond = respond;
module.exports.setupProjection = setupProjection;
module.exports.validateEvent = validateEvent;

'use strict';

/**
 * This module manages the data of the Cobia application.
 * @module model/model
 * @requires module:database
 * @requires module:lib/error-handling.logError
 */

const database = require('../database.js');
const logError = require('../lib/error-handling.js').logError;

const debug = require('debug')('cobia');          // eslint-disable-line no-unused-vars

const EVENT_COLLECTION = 'events';

/**
 * @summary Create a new document in the Events collection
 * @description
 * Inserts one event and returns the _id of the newly created document in a result object.
 * @static
 * @param {object} doc the new event document to create
 * @returns {Promise} A promise that resolves to a result object.
 */
function createEvent (doc) {
  return database.getConnectionPromise()
    .then(function (db) {
      return db.collection(EVENT_COLLECTION).insertOne(doc);
    })
    .then(function (opResult) {
      return Promise.resolve({
        created: opResult.insertedCount > 0,
        insertedCount: opResult.insertedCount,
        type: EVENT_COLLECTION,
        _id: opResult.ops[0]._id.toString() // eslint-disable-line no-underscore-dangle
      });
    })
    .catch(function (error) {
      logError(error);

      return Promise.reject(new Error(`There\'s a problem creating the ${EVENT_COLLECTION} in the database.`));
    });
}

/**
 * @summary Gets events from the Events collection.
 * @description
 * Returns the events in the results object.
 * @static
 * @param {object} projection The field projection object.
 * @param {number} limit The limit for the cursor query.
 * @param {object} sortCriteria The key or keys set for the sort.
 * @param {object} query The cursor query object.
 * @returns {Promise} A promise that resolves to a result object.
 */
function getEvents (projection, limit, sortCriteria, query) {
  debug('model.js#getEvents()');
  debug(`projection is ${JSON.stringify(projection, null, 2)}`);
  debug(`limit is ${limit}`);
  debug(`sortCriteria is ${JSON.stringify(sortCriteria, null, 2)}`);
  debug(`query is ${JSON.stringify(query, null, 2)}`);

  return database.getConnectionPromise()
    .then(function (db) {
      return db.collection(EVENT_COLLECTION)
        .find(query)
        .project(projection)
        .sort(sortCriteria)
        .limit(limit)
        .toArray();
    })
    .then(function (docs) {
      debug(`${docs.length} documents found.`);

      return Promise.resolve({
        found: docs.length > 0,
        type: EVENT_COLLECTION,
        documents: docs
      });
    })
    .catch(function (error) {
      logError(error);

      return Promise.reject(new Error(`There\'s a problem finding the ${EVENT_COLLECTION} in the database.`));
    });
}

/**
 * @summary xxx
 * @description
 * xxx
 * @static
 * @param {type} name description
 * @returns {Promise} A promise that resolves to a result object.
 */
function getListItems () {
  return database.getConnectionPromise()
    .then(function (db) {
      return db.collection('list-items').find().toArray();
    })
    .then(function (docs) {
      return Promise.resolve({
        found: docs.length > 0,
        type: 'list-items',
        documents: docs
      });
    })
    .catch(function (error) {
      logError(error);

      return Promise.reject(new Error('There\'s a problem finding the documents in the database.'));
    });
}

module.exports.createEvent = createEvent;
module.exports.getEvents = getEvents;
module.exports.getListItems = getListItems;

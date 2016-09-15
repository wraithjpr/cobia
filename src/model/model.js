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

/**
 * @summary xxx
 * @description
 * xxx
 * @static
 * @param {object} doc the new event document to create
 * @returns {Promise} A promise that resolves to a result object.
 */
function createEvent (doc) {
  return database.getConnectionPromise()
    .then(function (db) {
      return db.collection('events').insertOne(doc);
    })
    .then(function (opResult) {
      return Promise.resolve({
        created: opResult.insertedCount > 0,
        insertedCount: opResult.insertedCount,
        type: 'events',
        _id: opResult.ops[0]._id.toString() // eslint-disable-line no-underscore-dangle
      });
    })
    .catch(function (error) {
      logError(error);

      return Promise.reject(new Error('There\'s a problem creating the event in the database.'));
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
module.exports.getListItems = getListItems;

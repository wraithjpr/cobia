'use strict';

/**
 * This module exports a pooled database connection.
 * The connection is configured here: {@link module:database-config}
 * @module database
 * @requires module:mongodb
 * @requires module:database-config
 * @requires module:lib/error-handling
 */

const config = require('./database-config.js');
const configuredUrl = config.url || 'mongodb://localhost/Default';
const configuredOptions = config.options || {};

const MongoClient = require('mongodb').MongoClient;
const logError = require('./lib/error-handling.js').logError;

const debug = require('debug')('cobia');          // eslint-disable-line no-unused-vars

let connectionPromise = null;

/**
 * @summary Get a connection to the database.
 * @description
 * Returns a promise that resolves to a database connection.
 * This is a single pooled connection for the app.
 * Configure the database url and connection option settings in the `database-config.js` file.
 * @example
 * To be completed.
 * @static
 * @returns {Promise} dbPromise A promise that resolves to a database connection instance of type MongoClient~Db
 */
function getConnectionPromise () {
  // connectionPromise = connectionPromise || MongoClient.connect(configuredUrl, configuredOptions);
  if (!connectionPromise) {
    debug('First time, make a pooled database connection...');
    connectionPromise = MongoClient.connect(configuredUrl, configuredOptions);
  } else {
    debug('Re-using the database connection');
  }

  return connectionPromise.then(function (db) {
    if (!db) {
      throw new Error(`Database connection is unusable: ${configuredUrl}.`);
    }
    debug(`Connected to database: url is ${configuredUrl}, name is ${db.databaseName}`);

    return Promise.resolve(db);
  }, function (error) {
    logError(error);

    return Promise.reject(new Error(`Unable to connect to database: ${configuredUrl}.`));
  });
}

module.exports.getConnectionPromise = getConnectionPromise;

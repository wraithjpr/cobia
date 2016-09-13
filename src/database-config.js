'use strict';

/** This module configures the database connection.
 * See {@link module:database}
 * @module database-config
 */

/* eslint-disable no-magic-numbers */

/**
 * @summary Database configuration object.
 * @description See {@link http://mongodb.github.io/node-mongodb-native/2.0/api/MongoClient.html#.connect}
 * @static
 * @type {Object}
 * @member config
 */
var config = {

  /**
   * `options` object for `MongoClient.connect`
   * @type {Object}
   * @memberof config
   */
  options: {
    server: {
      poolSize: 10
    }
  },

  /**
   * url for `MongoClient.connect`
   * @type {String}
   * @memberof config
   */
  url: 'mongodb://localhost:27017/Cobia'
};

module.exports = config;

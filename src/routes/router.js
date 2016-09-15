'use strict';

/** This module exports the Express router for the Cobia application.
 * See {@link module:routes/api}
 * @module routes/router
 * @requires module:express
 * @requires module:routes/api
 */

var debug = require('debug')('cobia');
var express = require('express');

/**
 * @summary Cobia API
 * @description
 * Implementation of the REST API.
 * @private
 */
var api = require('./api.js');

/**
 * @summary The Express Router
 * @description
 * The instance of the Express router is assigned to module.exports.
 * @static
 */
var router = express.Router();              // eslint-disable-line new-cap

router.use(function (req, res, next) {
  debug('Cobia REST API');
  next();
});

// Add routes below...
router.get('/hello/', api.getHello);
router.get('/list-items/', api.getListItems);
router.post('/events/', api.validateEvent, api.buildNewEvent, api.createEvent);

// Export the Express router
module.exports = router;

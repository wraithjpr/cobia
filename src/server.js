'use strict';

const logError = require('./lib/error-handling.js').logError;

const config = require('./server-config.js');
const database = require('./database.js');
let dbConnection = null;

const protocolImpl = require(config.protocol);
const app = require('./app.js');
const server = protocolImpl.createServer(app);

if (server) {
  console.log('Server created.');
  database.getConnectionPromise()
    .then(function (db) {
      dbConnection = db;

      return db;
    })
    .then(function (db) {
      server.listen(config.port, function () {
        const boundAddress = server.address();

        console.log(
          'Server listening on %s://%s:%s',
          config.protocol,
          boundAddress.address === '::' ? 'localhost' : boundAddress.address,
          boundAddress.port
        );
      });

      return db;
    })
    .catch(function (err1) {
      logError(err1);
      if (dbConnection) {
        dbConnection.close(true, function () {
          console.log('Database connection closed.');
          dbConnection.unref();

          return;
        });
      }
      server.close(function () {
        console.log('Server closed');
        server.unref();

        return;
      });
    });
} else {
  logError('Cannot start up the server.');
}

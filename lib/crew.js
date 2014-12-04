'use strict';

var DockWorker = require('./DockWorker');

var crew = function (options, callback) {
  var dockWorker;

  if (!options) {
    throw new Error('Options are missing.');
  }

  if (!options.host) {
    throw new Error('Host is missing.');
  }

  if (!options.port) {
    throw new Error('Port is missing.');
  }

  if (!options.keys) {
    throw new Error('Keys are missing.');
  }

  if (!options.keys.privateKey) {
    throw new Error('Private key is missing.');
  }

  if (!options.keys.certificate) {
    throw new Error('Certificate is missing.');
  }

  if (!options.keys.caCertificate) {
    throw new Error('CA certificate is missing.');
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  options.protocol = 'https';

  dockWorker = new DockWorker(options);

  dockWorker.ping(function (err) {
    if (err) {
      return callback(err);
    }
    callback(null, dockWorker);
  });
};

module.exports = crew;

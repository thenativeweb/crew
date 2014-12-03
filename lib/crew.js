'use strict';

var Dockerode = require('dockerode');

var crew = function (options, callback) {
  var docker,
      server;

  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  /*eslint-disable no-process-env*/
  options.protocol = 'https';
  options.host = options.host || 'localhost';
  options.port = options.port || process.env.DOCKER_PORT || 2375;
  /*eslint-enable no-process-env*/

  server = new Dockerode(options);

  docker = {};

  callback(docker);
};

module.exports = crew;

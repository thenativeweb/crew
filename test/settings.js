'use strict';

var fs = require('fs'),
    path = require('path'),
    url = require('url');

var settings = {};

/*eslint-disable no-process-env*/
settings.host = url.parse(process.env.DOCKER_HOST).hostname;
settings.port = url.parse(process.env.DOCKER_HOST).port;

settings.privateKey = fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'key.pem'));
settings.certificate = fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'cert.pem'));
settings.caCertificate = fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'ca.pem'));
/*eslint-enable no-process-env*/

module.exports = settings;

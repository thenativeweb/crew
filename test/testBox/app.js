'use strict';

var fs = require('fs'),
    http = require('http');

/* eslint-disable no-process-env */
http.createServer(function (req, res) {
  res.end(fs.readFileSync('/data1/foo.txt', { encoding: 'utf8' }));
}).listen(process.env.PORT1 || 3000);

http.createServer(function (req, res) {
  res.end(fs.readFileSync('/data2/foo.txt', { encoding: 'utf8' }));
}).listen(process.env.PORT2 || 4000);

http.createServer(function (req, res) {
  res.end(fs.readFileSync('/etc/hosts', { encoding: 'utf8' }));
}).listen(process.env.PORT3 || 5000);

http.createServer(function (req, res) {
  res.end(fs.readFileSync('/etc/hosts', { encoding: 'utf8' }));
  setTimeout(function () {
    /* eslint-disable no-process-exit */
    process.exit(1);
    /* eslint-enable no-process-exit */
  }, 0.25 * 1000);
}).listen(process.env.PORT4 || 6000);

http.createServer(function (req, res) {
  try {
    res.end(fs.readFileSync('/toBeAdded/toBeIgnored.txt', { encoding: 'utf8' }));
  } catch (e) {
    res.writeHead(404);
    res.end();
  }
}).listen(process.env.PORT5 || 7000);
/* eslint-enable no-process-env */

setTimeout(function () {
  /* eslint-disable no-console */
  console.log('Test container running...');
  /* eslint-enable no-console */
}, 1 * 1000);

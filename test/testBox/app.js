'use strict';

var fs = require('fs'),
    http = require('http');

/*eslint-disable no-process-env*/
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
    /*eslint-disable no-process-exit*/
    process.exit(1);
    /*eslint-enable no-process-exit*/
  }, 0.25 * 1000);
}).listen(process.env.PORT4 || 6000);
/*eslint-enable no-process-env*/

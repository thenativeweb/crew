'use strict';

var fs = require('fs'),
    http = require('http');

/*eslint-disable no-process-env*/
http.createServer(function (req, res) {
  res.end(fs.readFileSync('/data/foo.txt', { encoding: 'utf8' }));
}).listen(process.env.PORT || 3000);

http.createServer(function (req, res) {
  res.end(fs.readFileSync('/data/foo.txt', { encoding: 'utf8' }));
}).listen(((process.env.PORT - 0) + 1) || 4000);
/*eslint-enable no-process-env*/

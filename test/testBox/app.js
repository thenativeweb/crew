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
/*eslint-enable no-process-env*/

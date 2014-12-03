'use strict';

var fs = require('fs'),
    http = require('http');

http.createServer(function (req, res) {
  res.end(fs.readFileSync('/data/foo.txt', { encoding: 'utf8' }));
}).listen(3000);

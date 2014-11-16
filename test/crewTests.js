'use strict';

var assert = require('node-assertthat');

var crew = require('../lib/crew');

suite('crew', function () {
  test('is an object.', function (done) {
    assert.that(crew, is.ofType('object'));
    done();
  });
});

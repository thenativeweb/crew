'use strict';

var assert = require('node-assertthat');

var crew = require('../lib/crew');

suite('crew', function () {
  test('is a function.', function (done) {
    assert.that(crew, is.ofType('function'));
    done();
  });

  test('throws an error when the callback is missing.', function (done) {
    assert.that(function () {
      crew();
    }, is.throwing('Callback is missing.'));
    done();
  });

  test('throws an error when the callback is missing, but an options object is given.', function (done) {
    assert.that(function () {
      crew({
        host: 'localhost',
        port: 2375
      });
    }, is.throwing('Callback is missing.'));
    done();
  });

  test('runs the callback.', function (done) {
    crew(function () {
      done();
    });
  });
});

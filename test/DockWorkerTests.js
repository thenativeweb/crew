'use strict';

var assert = require('node-assertthat');

var DockWorker = require('../lib/DockWorker'),
    settings = require('./settings');

suite('DockWorker', function () {
  var dockWorker;

  suiteSetup(function () {
    dockWorker = new DockWorker({
      protocol: 'https',
      host: settings.host,
      port: settings.port,
      keys: {
        privateKey: settings.privateKey,
        certificate: settings.certificate,
        caCertificate: settings.caCertificate
      }
    });
  });

  suite('ping', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.ping, is.ofType('function'));
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.ping();
      }, is.throwing('Callback is missing.'));
      done();
    });
  });

  suite('hasImage', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.hasImage, is.ofType('function'));
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.hasImage();
      }, is.throwing('Name is missing.'));
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.hasImage('thenativeweb/crew-test');
      }, is.throwing('Callback is missing.'));
      done();
    });

    test('returns true if the specified image is available.', function (done) {
      dockWorker.hasImage('thenativeweb/crew-test', function (err, hasImage) {
        assert.that(err, is.null());
        assert.that(hasImage, is.true());
        done();
      });
    });

    test('returns false if the specified image is not available.', function (done) {
      dockWorker.hasImage('thenativeweb/xxx-crew-test-xxx', function (err, hasImage) {
        assert.that(err, is.null());
        assert.that(hasImage, is.false());
        done();
      });
    });
  });

  suite('downloadImage', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.downloadImage, is.ofType('function'));
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.downloadImage();
      }, is.throwing('Name is missing.'));
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.downloadImage('thenativeweb/crew-test');
      }, is.throwing('Callback is missing.'));
      done();
    });

    test('returns an error if the specified image could not be downloaded.', function (done) {
      dockWorker.downloadImage('thenativeweb/xxx-crew-test-xxx', function (err) {
        assert.that(err, is.not.null());
        done();
      });
    });

    test('does not return an error if the specified image was downloaded.', function (done) {
      dockWorker.downloadImage('hello-world', function (err) {
        assert.that(err, is.null());
        done();
      });
    });
  });
});

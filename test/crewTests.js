'use strict';

var assert = require('assertthat');

var crew = require('../lib/crew'),
    settings = require('./settings');

suite('crew', function () {
  test('is a function.', function (done) {
    assert.that(crew).is.ofType('function');
    done();
  });

  test('throws an error when the options are missing.', function (done) {
    assert.that(function () {
      crew();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error when the host is missing.', function (done) {
    assert.that(function () {
      crew({
        port: settings.port,
        keys: {
          privateKey: settings.privateKey,
          certificate: settings.certificate,
          caCertificate: settings.caCertificate
        }
      });
    }).is.throwing('Host is missing.');
    done();
  });

  test('throws an error when the port is missing.', function (done) {
    assert.that(function () {
      crew({
        host: settings.host,
        keys: {
          privateKey: settings.privateKey,
          certificate: settings.certificate,
          caCertificate: settings.caCertificate
        }
      });
    }).is.throwing('Port is missing.');
    done();
  });

  test('throws an error when the keys are missing.', function (done) {
    assert.that(function () {
      crew({
        host: settings.host,
        port: settings.port
      });
    }).is.throwing('Keys are missing.');
    done();
  });

  test('throws an error when the private key is missing.', function (done) {
    assert.that(function () {
      crew({
        host: settings.host,
        port: settings.port,
        keys: {
          certificate: settings.certificate,
          caCertificate: settings.caCertificate
        }
      });
    }).is.throwing('Private key is missing.');
    done();
  });

  test('throws an error when the certificate is missing.', function (done) {
    assert.that(function () {
      crew({
        host: settings.host,
        port: settings.port,
        keys: {
          privateKey: settings.privateKey,
          caCertificate: settings.caCertificate
        }
      });
    }).is.throwing('Certificate is missing.');
    done();
  });

  test('throws an error when the CA certificate is missing.', function (done) {
    assert.that(function () {
      crew({
        host: settings.host,
        port: settings.port,
        keys: {
          privateKey: settings.privateKey,
          certificate: settings.certificate
        }
      });
    }).is.throwing('CA certificate is missing.');
    done();
  });

  test('throws an error when the callback is missing, but an options object is given.', function (done) {
    assert.that(function () {
      crew({
        host: settings.host,
        port: settings.port,
        keys: {
          privateKey: settings.privateKey,
          certificate: settings.certificate,
          caCertificate: settings.caCertificate
        }
      });
    }).is.throwing('Callback is missing.');
    done();
  });

  test('returns an error when the given Docker server is not reachable.', function (done) {
    crew({
      host: settings.host,
      port: 12345,
      keys: {
        privateKey: settings.privateKey,
        certificate: settings.certificate,
        caCertificate: settings.caCertificate
      }
    }, function (err) {
      assert.that(err).is.not.null();
      done();
    });
  });

  test('returns an error when the given Docker server is reachable, but the certificate does not match.', function (done) {
    // In this test, the CA certificate is being used as client certificate,
    // which does not match what the Docker server expects.
    crew({
      host: settings.host,
      port: settings.port,
      keys: {
        privateKey: settings.privateKey,
        certificate: settings.caCertificate,
        caCertificate: settings.caCertificate
      }
    }, function (err) {
      assert.that(err).is.not.null();
      done();
    });
  });

  test('returns an object when the given Docker server is reachable.', function (done) {
    crew({
      host: settings.host,
      port: settings.port,
      keys: {
        privateKey: settings.privateKey,
        certificate: settings.certificate,
        caCertificate: settings.caCertificate
      }
    }, function (err) {
      assert.that(err).is.null();
      done();
    });
  });
});

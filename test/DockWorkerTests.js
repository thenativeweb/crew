'use strict';

var childProcess = require('child_process');

var assert = require('node-assertthat'),
    Knock = require('knockat');

var DockWorker = require('../lib/DockWorker'),
    settings = require('./settings');

suite('DockWorker', function () {
  var dockWorker;

  this.timeout(10 * 1000);

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
        dockWorker.hasImage(settings.image);
      }, is.throwing('Callback is missing.'));
      done();
    });

    test('returns true if the specified image is available.', function (done) {
      dockWorker.hasImage(settings.image, function (err, hasImage) {
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
        dockWorker.downloadImage(settings.image);
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

  suite('startContainer', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.startContainer, is.ofType('function'));
      done();
    });

    test('throws an error if options are missing.', function (done) {
      assert.that(function () {
        dockWorker.startContainer();
      }, is.throwing('Options are missing.'));
      done();
    });

    test('throws an error if image is missing.', function (done) {
      assert.that(function () {
        dockWorker.startContainer({
          name: settings.containerName
        });
      }, is.throwing('Image is missing.'));
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.startContainer({
          image: settings.image
        });
      }, is.throwing('Name is missing.'));
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName
        });
      }, is.throwing('Callback is missing.'));
      done();
    });

    test('does not return an error if the container was started.', function (done) {
      dockWorker.startContainer({
        image: settings.image,
        name: settings.containerName
      }, function (err, id) {
        childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (childProcessErr) {
          assert.that(childProcessErr, is.null());
          assert.that(err, is.null());
          done();
        });
      });
    });

    suite('port forwardings', function () {
      test('forwards a single port.', function (done) {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName,
          ports: [
            { container: 3000, host: 3000 }
          ]
        }, function (err, id) {
          var knock;
          assert.that(err, is.null());

          knock = new Knock();
          knock.at(settings.host, 3000, function (err) {
            assert.that(err, is.null());

            childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (childProcessErr) {
              assert.that(childProcessErr, is.null());
              done();
            });
          });
        });
      });

      test('forwards multiple ports.', function (done) {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName,
          ports: [
            { container: 3000, host: 3000 },
            { container: 4000, host: 5000 }
          ]
        }, function (err, id) {
          var knock;
          assert.that(err, is.null());

          knock = new Knock();
          knock.at(settings.host, 3000, function (err) {
            assert.that(err, is.null());

            knock = new Knock();
            knock.at(settings.host, 5000, function (err) {
              assert.that(err, is.null());

              childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (childProcessErr) {
                assert.that(childProcessErr, is.null());
                done();
              });
            });
          });
        });
      });
    });

    suite('environment variables', function () {
      // ...
    });

    suite('volumes', function () {
      // ...
    });
  });

  suite('stopContainer', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.stopContainer, is.ofType('function'));
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.stopContainer();
      }, is.throwing('Name is missing.'));
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.stopContainer(settings.containerName);
      }, is.throwing('Callback is missing.'));
      done();
    });

    test('returns an error if the specified container could not be stopped.', function (done) {
      dockWorker.stopContainer('xxx-crew-test-xxx', function (err) {
        assert.that(err, is.not.null());
        done();
      });
    });

    test('does not return an error if the specified container was stopped.', function (done) {
      childProcess.exec('docker run -d --name ' + settings.containerName + ' ' + settings.image, function (childProcessErr) {
        assert.that(childProcessErr, is.null());
        dockWorker.stopContainer(settings.containerName, function (err) {
          assert.that(err, is.null());
          done();
        });
      });
    });
  });
});

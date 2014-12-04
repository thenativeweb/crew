'use strict';

var childProcess = require('child_process'),
    path = require('path'),
    url = require('url');

var assert = require('node-assertthat'),
    Knock = require('knockat'),
    request = require('request');

var DockWorker = require('../lib/DockWorker'),
    settings = require('./settings');

suite('DockWorker', function () {
  var dockWorker;

  this.timeout(10 * 1000);

  suiteSetup(function (done) {
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

    childProcess.exec('docker kill ' + settings.containerName + '; docker rm ' + settings.containerName, function () {
      // Intentionally ignore potential errors. Just clean up and go.
      done();
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
      test('sets a single environment variable.', function (done) {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName,
          env: {
            port1: 5000
          },
          ports: [
            { container: 5000, host: 5000 }
          ]
        }, function (err, id) {
          var knock;
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

      test('sets multiple environment variables.', function (done) {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName,
          env: {
            port1: 5000,
            port2: 6000
          },
          ports: [
            { container: 5000, host: 5000 },
            { container: 6000, host: 6000 }
          ]
        }, function (err, id) {
          var knock;
          assert.that(err, is.null());

          knock = new Knock();
          knock.at(settings.host, 5000, function (err) {
            assert.that(err, is.null());

            knock = new Knock();
            knock.at(settings.host, 6000, function (err) {
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

    suite('volumes', function () {
      test('mounts a single volume.', function (done) {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName,
          ports: [
            { container: 3000, host: 3000 }
          ],
          volumes: [
            { container: '/data1', host: path.join(__dirname, 'testBox', 'toBeMounted') }
          ]
        }, function (err, id) {
          assert.that(err, is.null());

          setTimeout(function () {
            request.get(url.format({
              protocol: 'http',
              hostname: settings.host,
              port: 3000,
              pathname: '/'
            }), function (err, res, body) {
              assert.that(err, is.null());
              assert.that(res.statusCode, is.equalTo(200));
              assert.that(body, is.equalTo('foobar\n'));

              childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (childProcessErr) {
                assert.that(childProcessErr, is.null());
                done();
              });
            });
          }, 0.5 * 1000);
        });
      });

      test('mounts multiple volumes.', function (done) {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName,
          ports: [
            { container: 3000, host: 3000 },
            { container: 4000, host: 4000 }
          ],
          volumes: [
            { container: '/data1', host: path.join(__dirname, 'testBox', 'toBeMounted') },
            { container: '/data2', host: path.join(__dirname, 'testBox', 'toBeMounted') }
          ]
        }, function (err, id) {
          assert.that(err, is.null());

          setTimeout(function () {
            request.get(url.format({
              protocol: 'http',
              hostname: settings.host,
              port: 3000,
              pathname: '/'
            }), function (err, res, body) {
              assert.that(err, is.null());
              assert.that(res.statusCode, is.equalTo(200));
              assert.that(body, is.equalTo('foobar\n'));

              request.get(url.format({
                protocol: 'http',
                hostname: settings.host,
                port: 4000,
                pathname: '/'
              }), function (err, res, body) {
                assert.that(err, is.null());
                assert.that(res.statusCode, is.equalTo(200));
                assert.that(body, is.equalTo('foobar\n'));

                childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (childProcessErr) {
                  assert.that(childProcessErr, is.null());
                  done();
                });
              });
            });
          }, 0.5 * 1000);
        });
      });
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

  suite('getRunningContainersFor', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.getRunningContainersFor, is.ofType('function'));
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.getRunningContainersFor();
      }, is.throwing('Name is missing.'));
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.getRunningContainersFor(settings.image);
      }, is.throwing('Callback is missing.'));
      done();
    });

    test('returns an empty array if no containers are running.', function (done) {
      dockWorker.getRunningContainersFor(settings.image, function (err, containers) {
        assert.that(err, is.null());
        assert.that(containers.length, is.equalTo(0));
        done();
      });
    });

    test('returns an empty array if no matching containers are running.', function (done) {
      dockWorker.startContainer({
        image: settings.image,
        name: settings.containerName
      }, function (err, id) {
        assert.that(err, is.null());

        dockWorker.getRunningContainersFor('xxx-thenativeweb/crew-test-xxx', function (err, containers) {
          assert.that(err, is.null());
          assert.that(containers.length, is.equalTo(0));
          dockWorker.stopContainer(settings.containerName, done);
        });
      });
    });

    test('returns an array of containers.', function (done) {
      dockWorker.startContainer({
        image: settings.image,
        name: settings.containerName,
        ports: [
          { container: 3000, host: 3000 }
        ],
        env: {
          port: 3000
        },
        volumes: [
          { container: '/data1', host: path.join(__dirname, 'testBox', 'toBeMounted') }
        ]
      }, function (err, id) {
        assert.that(err, is.null());

        dockWorker.getRunningContainersFor(settings.image, function (err, containers) {
          assert.that(err, is.null());
          assert.that(containers.length, is.equalTo(1));
          assert.that(containers[0].image, is.equalTo(settings.image));
          assert.that(containers[0].name, is.equalTo(settings.containerName));
          assert.that(containers[0].ports.length, is.equalTo(1));
          assert.that(containers[0].ports[0], is.equalTo({ container: 3000, host: 3000 }));
          assert.that(containers[0].env.PORT, is.equalTo('3000'));
          assert.that(containers[0].volumes.length, is.equalTo(1));
          assert.that(containers[0].volumes[0], is.equalTo({ container: '/data1', host: path.join(__dirname, 'testBox', 'toBeMounted') }));

          dockWorker.stopContainer(settings.containerName, done);
        });
      });
    });
  });
});

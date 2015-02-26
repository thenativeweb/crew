'use strict';

var childProcess = require('child_process'),
    path = require('path'),
    url = require('url');

var assert = require('assertthat'),
    knock = require('knockat'),
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
      assert.that(dockWorker.ping).is.ofType('function');
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.ping();
      }).is.throwing('Callback is missing.');
      done();
    });
  });

  suite('hasImage', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.hasImage).is.ofType('function');
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.hasImage();
      }).is.throwing('Name is missing.');
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.hasImage(settings.image);
      }).is.throwing('Callback is missing.');
      done();
    });

    test('returns true if the specified image is available.', function (done) {
      dockWorker.hasImage(settings.image, function (err, hasImage) {
        assert.that(err).is.null();
        assert.that(hasImage).is.true();
        done();
      });
    });

    test('returns false if the specified image is not available.', function (done) {
      dockWorker.hasImage('thenativeweb/xxx-crew-test-xxx', function (err, hasImage) {
        assert.that(err).is.null();
        assert.that(hasImage).is.false();
        done();
      });
    });
  });

  suite('downloadImage', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.downloadImage).is.ofType('function');
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.downloadImage();
      }).is.throwing('Name is missing.');
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.downloadImage(settings.image);
      }).is.throwing('Callback is missing.');
      done();
    });

    test('returns an error if the specified image could not be downloaded.', function (done) {
      dockWorker.downloadImage('thenativeweb/xxx-crew-test-xxx', function (err) {
        assert.that(err).is.not.null();
        done();
      });
    });

    test('does not return an error if the specified image was downloaded.', function (done) {
      dockWorker.downloadImage('hello-world', function (err) {
        assert.that(err).is.null();
        done();
      });
    });
  });

  suite('startContainer', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.startContainer).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', function (done) {
      assert.that(function () {
        dockWorker.startContainer();
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if image is missing.', function (done) {
      assert.that(function () {
        dockWorker.startContainer({
          name: settings.containerName
        });
      }).is.throwing('Image is missing.');
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.startContainer({
          image: settings.image
        });
      }).is.throwing('Name is missing.');
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName
        });
      }).is.throwing('Callback is missing.');
      done();
    });

    test('does not return an error if the container was started.', function (done) {
      dockWorker.startContainer({
        image: settings.image,
        name: settings.containerName
      }, function (err, id) {
        childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (childProcessErr) {
          assert.that(childProcessErr).is.null();
          assert.that(err).is.null();
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
        }, function (errStartContainer, id) {
          assert.that(errStartContainer).is.null();

          knock.at(settings.host, 3000, function (err) {
            assert.that(err).is.null();

            childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (childProcessErr) {
              assert.that(childProcessErr).is.null();
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
        }, function (errStartContainer, id) {
          assert.that(errStartContainer).is.null();

          knock.at(settings.host, 3000, function (errAt) {
            assert.that(errAt).is.null();

            knock.at(settings.host, 5000, function (err) {
              assert.that(err).is.null();

              childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (childProcessErr) {
                assert.that(childProcessErr).is.null();
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
            port1: 6000
          },
          ports: [
            { container: 6000, host: 6000 }
          ]
        }, function (errStartContainer, id) {
          assert.that(errStartContainer).is.null();

          knock.at(settings.host, 6000, function (errAt) {
            assert.that(errAt).is.null();

            childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (err) {
              assert.that(err).is.null();
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
            port1: 6000,
            port2: 7000
          },
          ports: [
            { container: 6000, host: 6000 },
            { container: 7000, host: 7000 }
          ]
        }, function (errStartContainer, id) {
          assert.that(errStartContainer).is.null();

          knock.at(settings.host, 6000, function (errAt1) {
            assert.that(errAt1).is.null();

            knock.at(settings.host, 7000, function (errAt2) {
              assert.that(errAt2).is.null();

              childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (err) {
                assert.that(err).is.null();
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
        }, function (errStartContainer, id) {
          assert.that(errStartContainer).is.null();

          setTimeout(function () {
            request.get(url.format({
              protocol: 'http',
              hostname: settings.host,
              port: 3000,
              pathname: '/'
            }), function (errGet, res, body) {
              assert.that(errGet).is.null();
              assert.that(res.statusCode).is.equalTo(200);
              assert.that(body).is.equalTo('foobar\n');

              childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (err) {
                assert.that(err).is.null();
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
        }, function (errStartContainer, id) {
          assert.that(errStartContainer).is.null();

          setTimeout(function () {
            request.get(url.format({
              protocol: 'http',
              hostname: settings.host,
              port: 3000,
              pathname: '/'
            }), function (errGet1, resGet, bodyGet) {
              assert.that(errGet1).is.null();
              assert.that(resGet.statusCode).is.equalTo(200);
              assert.that(bodyGet).is.equalTo('foobar\n');

              request.get(url.format({
                protocol: 'http',
                hostname: settings.host,
                port: 4000,
                pathname: '/'
              }), function (errGet2, res, body) {
                assert.that(errGet2).is.null();
                assert.that(res.statusCode).is.equalTo(200);
                assert.that(body).is.equalTo('foobar\n');

                childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (err) {
                  assert.that(err).is.null();
                  done();
                });
              });
            });
          }, 0.5 * 1000);
        });
      });
    });

    suite('links', function () {
      test('connects two containers.', function (done) {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName + '1'
        }, function (errStartContainer1, id1) {
          assert.that(errStartContainer1).is.null();

          dockWorker.startContainer({
            image: settings.image,
            name: settings.containerName + '2',
            links: [
              { name: settings.containerName + '1', alias: 'foobar' }
            ],
            ports: [
              { container: 5000, host: 5000 }
            ]
          }, function (errStartContainer2, id2) {
            assert.that(errStartContainer2).is.null();

            setTimeout(function () {
              request.get(url.format({
                protocol: 'http',
                hostname: settings.host,
                port: 5000,
                pathname: '/'
              }), function (errGet, resGet, bodyGet) {
                assert.that(errGet).is.null();
                assert.that(resGet.statusCode).is.equalTo(200);
                assert.that(bodyGet.indexOf('foobar')).is.not.equalTo(-1);

                childProcess.exec([
                  'docker kill ' + id1,
                  'docker rm ' + id1,
                  'docker kill ' + id2,
                  'docker rm ' + id2
                ].join(' && '), function (err) {
                  assert.that(err).is.null();
                  done();
                });
              });
            }, 0.5 * 1000);
          });
        });
      });
    });

    suite('network.hosts', function () {
      test('adds additional entries to /etc/hosts.', function (done) {
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName,
          ports: [
            { container: 5000, host: 5000 }
          ],
          network: {
            hosts: [
              { name: 'local.wolkenkit.io', ip: '192.168.59.103' },
              { name: 'auth.wolkenkit.io', ip: '192.168.59.104' }
            ]
          }
        }, function (errStartContainer, id) {
          assert.that(errStartContainer).is.null();

          setTimeout(function () {
            request.get(url.format({
              protocol: 'http',
              hostname: settings.host,
              port: 5000,
              pathname: '/'
            }), function (errGet, resGet, bodyGet) {
              assert.that(errGet).is.null();
              assert.that(resGet.statusCode).is.equalTo(200);
              assert.that(/^192\.168\.59\.103\s+local\.wolkenkit\.io$/gm.test(bodyGet)).is.true();
              assert.that(/^192\.168\.59\.104\s+auth\.wolkenkit\.io$/gm.test(bodyGet)).is.true();

              childProcess.exec('docker kill ' + id + ' && docker rm ' + id, function (err) {
                assert.that(err).is.null();
                done();
              });
            });
          }, 0.5 * 1000);
        });
      });
    });
  });

  suite('stopContainer', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.stopContainer).is.ofType('function');
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.stopContainer();
      }).is.throwing('Name is missing.');
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.stopContainer(settings.containerName);
      }).is.throwing('Callback is missing.');
      done();
    });

    test('returns an error if the specified container could not be stopped.', function (done) {
      dockWorker.stopContainer('xxx-crew-test-xxx', function (err) {
        assert.that(err).is.not.null();
        done();
      });
    });

    test('does not return an error if the specified container was stopped.', function (done) {
      childProcess.exec('docker run -d --name ' + settings.containerName + ' ' + settings.image, function (childProcessErr) {
        assert.that(childProcessErr).is.null();
        dockWorker.stopContainer(settings.containerName, function (err) {
          assert.that(err).is.null();
          done();
        });
      });
    });
  });

  suite('getRunningContainersFor', function () {
    test('is a function.', function (done) {
      assert.that(dockWorker.getRunningContainersFor).is.ofType('function');
      done();
    });

    test('throws an error if name is missing.', function (done) {
      assert.that(function () {
        dockWorker.getRunningContainersFor();
      }).is.throwing('Name is missing.');
      done();
    });

    test('throws an error if callback is missing.', function (done) {
      assert.that(function () {
        dockWorker.getRunningContainersFor(settings.image);
      }).is.throwing('Callback is missing.');
      done();
    });

    test('returns an empty array if no containers are running.', function (done) {
      dockWorker.getRunningContainersFor(settings.image, function (err, containers) {
        assert.that(err).is.null();
        assert.that(containers.length).is.equalTo(0);
        done();
      });
    });

    test('returns an empty array if no matching containers are running.', function (done) {
      dockWorker.startContainer({
        image: settings.image,
        name: settings.containerName
      }, function (errStartContainer) {
        assert.that(errStartContainer).is.null();

        dockWorker.getRunningContainersFor('xxx-thenativeweb/crew-test-xxx', function (err, containers) {
          assert.that(err).is.null();
          assert.that(containers.length).is.equalTo(0);
          dockWorker.stopContainer(settings.containerName, done);
        });
      });
    });

    test('returns an array of containers.', function (done) {
      dockWorker.startContainer({
        image: settings.image,
        name: settings.containerName + '1'
      }, function (errStartContainer1) {
        assert.that(errStartContainer1).is.null();
        dockWorker.startContainer({
          image: settings.image,
          name: settings.containerName + '2',
          ports: [
            { container: 3000, host: 3000 }
          ],
          env: {
            port: 3000
          },
          volumes: [
            { container: '/data1', host: path.join(__dirname, 'testBox', 'toBeMounted') }
          ],
          links: [
            { name: settings.containerName + '1', alias: 'foobar' }
          ],
          network: {
            hosts: [
              { name: 'example.com', ip: '192.168.0.1' }
            ]
          }
        }, function (errStartContainer) {
          assert.that(errStartContainer).is.null();

          dockWorker.getRunningContainersFor(settings.image, function (errGetRunningContainersFor, containers) {
            assert.that(errGetRunningContainersFor).is.null();
            assert.that(containers.length).is.equalTo(2);

            assert.that(containers[0].image).is.equalTo(settings.image);
            assert.that(containers[0].name).is.equalTo(settings.containerName + '2');
            assert.that(containers[0].ports.length).is.equalTo(1);
            assert.that(containers[0].ports[0]).is.equalTo({ container: 3000, host: 3000 });
            assert.that(containers[0].env.PORT).is.equalTo('3000');
            assert.that(containers[0].volumes.length).is.equalTo(1);
            assert.that(containers[0].volumes[0]).is.equalTo({ container: '/data1', host: path.join(__dirname, 'testBox', 'toBeMounted') });
            assert.that(containers[0].links.length).is.equalTo(1);
            assert.that(containers[0].links[0]).is.equalTo({ name: settings.containerName + '1', alias: 'foobar' });
            assert.that(containers[0].network.hosts.length).is.equalTo(1);
            assert.that(containers[0].network.hosts[0]).is.equalTo({ name: 'example.com', ip: '192.168.0.1' });

            assert.that(containers[1].image).is.equalTo(settings.image);
            assert.that(containers[1].name).is.equalTo(settings.containerName + '1');
            assert.that(containers[1].ports).is.equalTo([]);
            assert.that(containers[1].volumes).is.equalTo([]);
            assert.that(containers[1].links).is.equalTo([]);
            assert.that(containers[1].network.hosts).is.equalTo([]);

            dockWorker.stopContainer(settings.containerName + '2', function (err) {
              assert.that(err).is.null();
              dockWorker.stopContainer(settings.containerName + '1', done);
            });
          });
        });
      });
    });
  });
});

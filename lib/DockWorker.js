'use strict';

var _ = require('lodash'),
    Dockerode = require('dockerode'),
    Q = require('q');

var DockWorker = function (options) {
  this.server = new Dockerode({
    protocol: options.protocol,
    host: options.host,
    port: options.port,
    key: options.keys.privateKey,
    cert: options.keys.certificate,
    ca: options.keys.caCertificate
  });
};

DockWorker.prototype.ping = function (callback) {
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  this.server.ping(callback);
};

DockWorker.prototype.hasImage = function (name, callback) {
  if (!name) {
    throw new Error('Name is missing.');
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  this.server.listImages(function (err, images) {
    var hasImage;

    if (err) {
      return callback(err);
    }

    hasImage = _.some(images, function (image) {
      return _.some(image.RepoTags, function (repoTag) {
        return repoTag.split(':')[0] === name;
      });
    });

    callback(null, hasImage);
  });
};

DockWorker.prototype.downloadImage = function (name, callback) {
  if (!name) {
    throw new Error('Name is missing.');
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  this.server.pull(name, function (err, stream) {
    if (err) {
      return callback(err);
    }

    stream.on('data', function (data) {
      data = JSON.parse(data.toString('utf8'));

      if (data.error) {
        callback(new Error(data.error));
        stream.removeAllListeners();
        stream.resume();
      }
    });

    stream.on('end', function () {
      stream.removeAllListeners();
      callback(null);
    });
  });
};

DockWorker.prototype.startContainer = function (options, callback) {
  var containerOptions;

  if (!options) {
    throw new Error('Options are missing.');
  }

  if (!options.image) {
    throw new Error('Image is missing.');
  }

  if (!options.name) {
    throw new Error('Name is missing.');
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  containerOptions = {
    Image: options.image,
    name: options.name,
    HostConfig: {}
  };

  if (options.env) {
    containerOptions.Env = [];
    _.forOwn(options.env, function (value, key) {
      containerOptions.Env.push(key.toUpperCase() + '=' + value);
    });
  }

  if (options.volumes) {
    containerOptions.Volumes = {};
    _.forEach(options.volumes, function (volume) {
      containerOptions.Volumes[volume.container] = {};
    });

    containerOptions.HostConfig.Binds = [];
    _.forEach(options.volumes, function (volume) {
      containerOptions.HostConfig.Binds.push(volume.host + ':' + volume.container);
    });
  }

  if (options.ports) {
    containerOptions.ExposedPorts = {};
    _.forEach(options.ports, function (portFowarding) {
      containerOptions.ExposedPorts[portFowarding.container + '/tcp'] = {};
    });

    containerOptions.HostConfig.PortBindings = {};
    _.forEach(options.ports, function (portFowarding) {
      containerOptions.HostConfig.PortBindings[portFowarding.container + '/tcp'] = [
        { HostPort: '' + portFowarding.host }
      ];
    });
  }

  if (options.links) {
    containerOptions.HostConfig.Links = [];
    _.forOwn(options.links, function (link) {
      containerOptions.HostConfig.Links.push(link.name + ':' + link.alias);
    });
  }

  if (options.network && options.network.hosts) {
    containerOptions.HostConfig.ExtraHosts = [];
    _.forOwn(options.network.hosts, function (host) {
      containerOptions.HostConfig.ExtraHosts.push(host.name + ':' + host.ip);
    });
  }

  this.server.createContainer(containerOptions, function (errCreateContainer, container) {
    if (errCreateContainer) {
      return callback(errCreateContainer);
    }

    container.start(function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, container.id);
    });
  });
};

DockWorker.prototype.getRunningContainersFor = function (name, callback) {
  var that = this;

  if (!name) {
    throw new Error('Name is missing.');
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  that.server.listContainers(function (errListContainers, containerInfos) {
    var inspectContainers = [];

    if (errListContainers) {
      return callback(errListContainers);
    }

    _.forEach(containerInfos, function (containerInfo) {
      var container = that.server.getContainer(containerInfo.Id);
      var deferred = Q.defer();

      container.inspect(function (errInspect, data) {
        if (errInspect) {
          return deferred.reject(errInspect);
        }
        deferred.resolve(data);
      });

      inspectContainers.push(deferred.promise);
    });

    Q.all(inspectContainers).done(function (containers) {
      containers = _.filter(containers, function (container) {
        return container.Config.Image === name;
      });

      containers = _.map(containers, function (container) {
        var environmentVariables = container.Config.Env,
            links = container.HostConfig.Links,
            network = {
              hosts: container.HostConfig.ExtraHosts
            },
            ports = container.HostConfig.PortBindings,
            volumes = container.HostConfig.Binds;

        ports = _.map(ports, function (value, key) {
          return {
            container: key.split('/')[0] - 0,
            host: value[0].HostPort - 0
          };
        });

        environmentVariables = _.map(environmentVariables, function (environmentVariable) {
          var parts = environmentVariable.split('=');
          return {
            key: parts[0],
            value: parts[1]
          };
        });

        environmentVariables = _.object(
          _.pluck(environmentVariables, 'key'),
          _.pluck(environmentVariables, 'value')
        );

        links = _.map(links, function (link) {
          var parts = link.split(':');
          return {
            name: parts[0].substring(parts[0].lastIndexOf('/') + 1),
            alias: parts[1].substring(parts[1].lastIndexOf('/') + 1)
          };
        });

        network.hosts = _.map(network.hosts, function (hostEntry) {
          var parts = hostEntry.split(':');
          return {
            name: parts[0],
            ip: parts[1]
          };
        });

        volumes = _.map(volumes, function (volume) {
          var parts = volume.split(':');
          return {
            container: parts[1],
            host: parts[0]
          };
        });

        return {
          env: environmentVariables,
          image: name,
          links: links,
          name: container.Name.substring(1),
          network: network,
          ports: ports,
          volumes: volumes
        };
      });

      callback(null, containers);
    }, function (err) {
      callback(err);
    });
  });
};

DockWorker.prototype.stopContainer = function (name, callback) {
  var container;

  if (!name) {
    throw new Error('Name is missing.');
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  container = this.server.getContainer(name);

  container.kill(function (err) {
    if (err) {
      return callback(err);
    }

    container.remove({ v: true }, callback);
  });
};

module.exports = DockWorker;

'use strict';

var _ = require('lodash'),
    Dockerode = require('dockerode');

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
  var containerStartOptions,
      createContainerOptions;

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

  createContainerOptions = {
    Image: options.image,
    name: options.name
  };

  if (options.ports) {
    createContainerOptions.ExposedPorts = {};
    _.forEach(options.ports, function (portFowarding) {
      createContainerOptions.ExposedPorts[portFowarding.container + '/tcp'] = {};
    });
  }

  this.server.createContainer(createContainerOptions, function (err, container) {
    if (err) {
      return callback(err);
    }

    containerStartOptions = {};

    if (options.ports) {
      containerStartOptions.PortBindings = {};
      _.forEach(options.ports, function (portFowarding) {
        containerStartOptions.PortBindings[portFowarding.container + '/tcp'] = [
          { HostPort: '' + portFowarding.host }
        ];
      });
    }

    container.start(containerStartOptions, function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, container.id);
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

    container.remove(callback);
  });
};

module.exports = DockWorker;

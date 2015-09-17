# crew

crew makes managing Docker a breeze.

## Installation

    $ npm install crew

## Quick start

First you need to add a reference to crew to to your application.

```javascript
const crew = require('crew');
```

To connect to a Docker server, call the `crew` function and provide the hostname as well as the port. Additionally, you need to provide a private key and a certificate for client-side authentication, and a CA certificate for server-side authentication.

You may use the environment variables `DOCKER_HOST` and `DOCKER_CERT_PATH` to get appropriate values.

```javascript
crew({
  host: url.parse(process.env.DOCKER_HOST).hostname,
  port: url.parse(process.env.DOCKER_HOST).port,
  keys: {
    privateKey: fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'key.pem')),
    certificate: fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'cert.pem')),
    caCertificate: fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'ca.pem'))
  }
}, (err, dockWorker) => {
  // ...
});
```

Please note that the initially provided options are available at `dockWorker.options`.

### Pinging Docker

To ping the Docker server, use the `ping` function.

```javascript
dockWorker.ping(err => {
  // ...
});
```

### Verifying that an image is available

If you need to verify whether an image is available on the Docker server, use the `hasImage` function and provide the name of the image.

```javascript
dockWorker.hasImage({ name: 'node' }, (err, hasImage) => {
  console.log(hasImage); // => true
  // ...
});
```

`hasImage` also supports tags to check for a particular version of an image, as in the following example.

```javascript
dockWorker.hasImage({ name: 'node', tag: '4.0' }, (err, hasImage) => {
  console.log(hasImage); // => true
  // ...
});
```

### Downloading an image

To download an image to the Docker server, use the `downloadImage` function and provide the name of the image.

```javascript
dockWorker.downloadImage({ name: 'node' }, err => {
  // ...
});
```

 If you want to download a specific version, add the tag to the name of the image.

```javascript
dockWorker.downloadImage({ name: 'node', tag: '4.0' }, err => {
  // ...
});
```

If you don't specify a tag, the tag `latest` will be used which is also the default used by the Docker CLI.

### Building an image

To build an image, call the `buildImage` function and provide the directory you want to use, a `Dockerfile`, and the name of the image.

```javascript
dockWorker.buildImage({
  directory: __dirname,
  dockerfile: path.join(__dirname, 'my-dockerfile'),
  name: 'myImage'
}, err => {
  // ...
});
```

`buildImage` also supports tags fors images by passing in the optional `tag` option.

```javascript
dockWorker.buildImage({
  directory: __dirname,
  dockerfile: path.join(__dirname, 'my-dockerfile'),
  name: 'myImage',
  tag: '0.1.0'
}, err => {
  // ...
});
```

If you want to exclude some files from the newly built image, you can use the `dockerignore` property to provide the path to an ignore file.

```javascript
dockWorker.buildImage({
  directory: __dirname,
  dockerfile: path.join(__dirname, 'my-dockerfile'),
  dockerignore: path.join(__dirname, 'my-dockerignore'),
  name: 'myImage'
}, err => {
  // ...
});
```

If you want to modify the build context right before the image gets built, register a `preBuild` hook and do whatever you want to do.

```javascript
dockWorker.buildImage({
  directory: __dirname,
  dockerfile: path.join(__dirname, 'my-dockerfile'),
  dockerignore: path.join(__dirname, 'my-dockerignore'),
  preBuild: (preBuildOptions, done) => {
    console.log(preBuildOptions);
    // => {
    //      directory: '...'
    //    }

    done(null);
  },
  name: 'myImage'
}, err => {
  // ...
});
```

### Starting a container

To create and start a container, call the `startContainer` function and provide the name of the image and the desired container name. This returns the newly created container's id.

```javascript
dockWorker.startContainer({
  image: 'node',
  name: 'myContainer'
}, (err, id) => {
  console.log(id); // => '70073a08b0f7fdfef44ca6fe03ba5e796d4773d9628b6f68eb7e34568dc73e1f'
  // ...
});
```

`startContainer` also supports image tags.

```javascript
dockWorker.startContainer({
  image: 'node',
  tag: '4.0',
  name: 'myContainer'
}, (err, id) => {
  console.log(id); // => '70073a08b0f7fdfef44ca6fe03ba5e796d4773d9628b6f68eb7e34568dc73e1f'
  // ...
});
```

#### Restarting crashed containers

If you want your container to restart automatically on crashes, add the `restart` property to the parameter object and set it to `true`.

```javascript
dockWorker.startContainer({
  image: 'node',
  name: 'myContainer',
  restart: true
}, (err, id) => {
  // ...
});
```

#### Forwarding ports

To forward container ports to the host, add the `ports` property to the parameter object and hand over an array of forwardings.

```javascript
dockWorker.startContainer({
  image: 'node',
  name: 'myContainer',
  ports: [
    { container: 3000, host: 80 }
  ]
}, (err, id) => {
  // ...
});
```

#### Setting environment variables

To set environment variables, add the `env` property to the parameter object and hand over the keys and values you want to use as environment variables.

```javascript
dockWorker.startContainer({
  image: 'node',
  name: 'myContainer',
  env: {
    port: 3000
  }
}, (err, id) => {
  // ...
});
```

#### Using volumes

To use volumes from the host, add the `volumes` property to the parameter object and hand over an array of volume mappings.

```javascript
dockWorker.startContainer({
  image: 'node',
  name: 'myContainer',
  volumes: [
    { container: '/data', host: '/home/janedoe/foo' }
  ]
}, (err, id) => {
  // ...
});
```

#### Using links

To link a container to another one, add the `links` property to the parameter object and hand over an array of link mappings.

```javascript
dockWorker.startContainer({
  image: 'node',
  name: 'myContainer',
  links: [
    { name: 'mongodb', alias: 'db' }
  ]
}, (err, id) => {
  // ...
});
```

#### Configuring network settings

To add extra hosts to the container's `/etc/hosts` file, add the `network` property to the parameter object and assign a `hosts` property to it.

```javascript
dockWorker.startContainer({
  image: 'node',
  name: 'myContainer',
  network: {
    hosts: [
      { name: 'example.com', ip: '192.168.0.1' }
    ]
  }
}, (err, id) => {
  // ...
});
```

### Getting information on running containers

To get information on running containers for a specific image, use the `getRunningContainersFor` function and provide the image name.

```javascript
dockWorker.getRunningContainersFor({ name: 'node' }, (err, containers) => {
  console.log(containers);
  // => [
  //      {
  //        image: 'node',
  //        name: 'my-container',
  //        ports: [
  //          { container: 3000, host: 3000 }
  //        ],
  //        env: {
  //          PORT: '3000'
  //        },
  //        volumes: [
  //          { container: '/data', host: '/home/janedoe/foo' }
  //        ],
  //        links: [
  //          { name: 'your-container', alias: 'yours' }
  //        ],
  //        network: {
  //          hosts: [
  //            { name: 'example.com', ip: '192.168.0.1' }
  //          ]
  //        }
  //      }
  //    ]
});
```

Again, you may also specify an image tag.

```javascript
dockWorker.getRunningContainersFor({ name: 'node', tag: '4.0' }, (err, containers) => {
  // ...
});
```

Alternatively you may specify the image name by a regular expression.

```javascript
dockWorker.getRunningContainersFor(/^no/, (err, containers) => {
  // ...
});
```

### Getting logs of a container

To get the logs of a running container, call the `getLogs` function and provide the name of the container.

```javascript
dockWorker.getLogs('myContainer', (err, stdOut, stdErr) => {
  // ...
});
```

### Stopping a container

To stop and automatically remove a running container, call the `stopContainer` function and provide the name of the container.

```javascript
dockWorker.stopContainer('myContainer', err => {
  // ...
});
```

## Running the build

This module can be built using [Grunt](http://gruntjs.com/). Besides running the tests, this also analyses the code. To run Grunt, go to the folder where you have installed crew and run `grunt`. You need to have [grunt-cli](https://github.com/gruntjs/grunt-cli) installed.

    $ grunt

Before running the test, you need to build the `thenativeweb/crew-test` image. It is included in this repository. To build it, run the following command.

    $ grunt build

If you're using Docker Machine, make sure to copy the crew source folder to your Docker Machine before running the tests. Assuming your Docker machine name is `dev` and you're in the `crew` source folder on your local machine run the following commands.

```bash
docker-machine ssh dev -- mkdir -p $(pwd)
docker-machine scp -r . dev:$(pwd)
```

After this, you can run the tests as described above.

## License

The MIT License (MIT)
Copyright (c) 2014-2015 the native web.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

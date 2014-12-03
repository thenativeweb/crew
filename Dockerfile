FROM thenativeweb/node
MAINTAINER the native web <hello@thenativeweb.io>

ADD ./test/testBox/app.js /app.js

CMD [ "node", "/app.js" ]

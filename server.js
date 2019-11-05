const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid')
const chokidar = require('chokidar')
const path = require('path')

const port = Number(process.env.PORT)
const keys = require(process.env.KEYS)

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });
const sockets = {}

// Express Server

app.get('/build/:build/:key/build.tar.gz', function (req, res) {
  const { build, key } = req.params
  if (keys[build] == key) {
    return res.sendFile(`${build}.tar.gz`, {
      root: path.join(__dirname, 'public')
    });
  }
  return res.status(401).send('Unauthorized');
});

// WebSocket Server

wss.on('connection', function (ws, request) {

  ws.id = uuid.v4()
  sockets[ws.id] = { ws, subs: [] }

  ws.on('message', function (message) {
    const { command, args } = JSON.parse(message)

    if (command == 'subscribe') {
      const { build } = args
      sockets[ws.id].subs.push(build)
    }

  });

  ws.on('close', function () {
    delete sockets[ws.id]
  });

});

// FS Events and Notifications

const informClients = path => {
  const fileName = path.replace(/^public\//, '').replace(/\.tar\.gz$/, '')
  Object.values(sockets).forEach(({ ws, subs }) => {
    if (subs.includes(fileName)) {
      ws.send(JSON.stringify({ event: 'change', data: { build: fileName } }))
    }
  })
}

const watcher = chokidar.watch('public', {
  ignored: /^\./,
  persistent: true,
  awaitWriteFinish: true,
  ignoreInitial: true
});

watcher
  .on('change', informClients)
  .on('add', informClients)

server.listen(port)
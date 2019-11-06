const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid')
const chokidar = require('chokidar')
const path = require('path')

const port = Number(process.env.PORT)
const keys = require(process.env.KEYS)
const notifyMax = Number(process.env.MAX || 8)
const notifyWait = Number(process.env.WAIT || 20000)

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });
const sockets = {}

const log = (...args) => console.log(new Date(), ...args)

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
  log(`${ws.id} connected`)

  ws.on('message', function (message) {
    const { command, args } = JSON.parse(message)

    if (command == 'subscribe') {
      const { build } = args
      sockets[ws.id].subs.push(build)
      log(`${ws.id} subscribed to ${build}`)
    }

  });

  ws.on('close', function () {
    log(`${ws.id} disconnected`)
    delete sockets[ws.id]
  });

});

// Notifications

const notifications = []

const informClients = path => {
  const fileName = path.replace(/^.*?public\//, '').replace(/\.tar\.gz$/, '')
  log(`Change detected: ${fileName}`);
  Object.values(sockets).forEach(({ ws, subs }) => {
    if (subs.includes(fileName)) {
      notifications.push({
        ws,
        message: {
          event: 'change',
          data: {
            build: fileName
          }
        }
      })
    }
  })
}

const notify = () => {
  notifications.splice(0, notifyMax).forEach(({ ws, message }) => {
    ws.send(JSON.stringify(message))
    log(`Notified ${ws.id} of ${message.data.build} changes`);
  })
  setTimeout(notify, notifyWait)
}

notify()

// FS Events

const publicDir = path.resolve(__dirname, 'public')
const watcher = chokidar.watch(publicDir, {
  ignored: /^\./,
  persistent: true,
  awaitWriteFinish: true,
  ignoreInitial: true
});

watcher
  .on('change', informClients)
  .on('add', informClients)

server.listen(port)
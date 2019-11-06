const WebSocket = require('ws');
const { exec } = require('child_process');

const { COMMAND: command, KEY: key } = process.env

const log = (...args) => console.log(new Date(), ...args)

const connect = () => {
  const ws = new WebSocket(process.env.HOST);

  ws.on('error', function (error) {

  })

  ws.on('open', function open() {
    const message = JSON.stringify({
      command: 'subscribe',
      args: {
        build: process.env.BUILD
      }
    })
    ws.send(message);
  });

  ws.on('message', function incoming(message) {
    const { event, data } = JSON.parse(message)
    if (event == 'change') {
      const { build } = data
      log(`New build: ${build} available`);
      exec(`${command} ${build} ${key}`,
        (error, stdout, stderr) => {
          if (error !== null) {
            log(`Fetch error: ${error}`);
            log(stderr);
          }
        });
    }
  });

  ws.on('close', connect)
}

connect()
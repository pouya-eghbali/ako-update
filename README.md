# Ako Update

Ako ERP update server and client.

## Description

This is a very simple, KISS update client and server for
Ako ERP. However, with little modifications it can be used
for different applications.

This tool is made of two parts:

1) A HTTP / WebSocket server, to notify the clients of
new builds and to serve these builds to the clients.

2) A WebSocket client, to get notifications from the
update server and execute a command (to fetch the new build
and install).

## Server

Environment variables:

  | Variable | Description                                |
  | ---------|--------------------------------------------|
  | PORT     | Port number to use for the server          |
  | KEYS     | Path to a `keys.js` file                   |
  | MAX      | Max clients to notify at a time            |
  | WAIT     | Wait time between each notification round  |

## Client

Environment variables:

  | Variable | Description                                |
  | ---------|--------------------------------------------|
  | HOST     | WebSocket server to connect to             |
  | KEY      | Key to use for authorization               |
  | COMMAND  | Command to run when an update is available |
  | BUILD    | Build ID to subscribe to                   |

The client auto connects in case the socket connection dies.

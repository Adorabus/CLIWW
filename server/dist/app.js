"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const bodyParser = require("body-parser");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.use(bodyParser.json());
io.on('connection', (client) => {
    console.log(`Connection from: ${client.client.conn.remoteAddress}`);
    client.on('command', (data) => {
        io.emit('message', `${client.id}: ${data}`);
    });
    client.on('disconnect', () => {
        console.log(`${client.id} disconnected.`);
    });
});
server.listen(process.env.PORT || 8999, () => {
    const addrInfo = server.address();
    console.log(addrInfo);
});
//# sourceMappingURL=app.js.map
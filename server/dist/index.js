"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const socketIO = require("socket.io");
const express = require("express");
const wrapper_1 = require("./wrapper");
const messenger_1 = require("./messenger");
const yargs = require("yargs");
const path = require("path");
const fs = require("fs");
const argv = yargs
    .usage('Usage: $0 [options] <command>')
    .option('password', {
    describe: 'Console access password.'
})
    .option('limit', {
    describe: 'Maximum stored messages. (Default: Unlimited)',
    type: 'number'
})
    .option('port', {
    describe: 'Port to bind to. (Default: 8999)',
    type: 'number'
})
    .boolean('keepalive')
    .describe('keepalive', 'Restart the process if it exits.')
    .demandCommand(1, 'No command specified.')
    .argv;
const app = express();
let server;
const { key, cert } = process.env;
if (key && cert) {
    try {
        server = require('https').createServer({
            key: fs.readFileSync(key),
            cert: fs.readFileSync(cert)
        }, app);
        console.log('Starting using https...');
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
}
else {
    console.log('Starting using http...');
    server = require('http').createServer(app);
}
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const io = socketIO(server);
const command = argv._.shift();
const wrapper = new wrapper_1.Wrapper(command, argv._, argv);
const messenger = new messenger_1.Messenger(io, wrapper, argv);
wrapper.startProcess();
server.listen(argv.port || 8999, () => {
    const addrInfo = server.address();
    console.log(`Listening on port ${addrInfo.port}.`);
});

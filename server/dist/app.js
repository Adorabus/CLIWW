"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const wrapper_1 = require("./wrapper");
const messenger_1 = require("./messenger");
const yargs = require("yargs");
const argv = yargs
    .usage('Usage: $0 [options] <command>')
    .option('password', {
    alias: 'p',
    describe: 'Console access password.'
})
    .demandCommand(1, 'No command specified.')
    .argv;
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server);
const command = argv._.shift();
const wrapper = new wrapper_1.default({
    command,
    args: argv._
});
const messenger = new messenger_1.default(io, wrapper, argv.password);
app.get('/console', (req, res) => {
    if (req.query.password === argv.password) {
        res.send({
            messages: messenger.messages
        });
    }
    else {
        res.status(403).send({
            error: 'Password required.'
        });
    }
});
server.listen(process.env.PORT || 8999, () => {
    const addrInfo = server.address();
    console.log(`Listening on port ${addrInfo.port}.`);
});
//# sourceMappingURL=app.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const bodyParser = require("body-parser");
const wrapper_1 = require("./wrapper");
const messenger_1 = require("./messenger");
const router_1 = require("./router");
const database_1 = require("./database");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.use(bodyParser.json());
const idx = process.argv.indexOf('--cmd');
if (idx === -1) {
    console.error('Missing launch command! (--cmd command [arg1, ...])');
    process.exit(1);
}
const args = process.argv.splice(idx + 1, process.argv.length);
const command = args.shift();
const wrapper = new wrapper_1.default({ command, args });
const messenger = new messenger_1.default(io, wrapper);
router_1.default(app, messenger);
console.log('Opening connection to database...');
database_1.default()
    .then(() => {
    console.log('Connection to database established.');
    server.listen(process.env.PORT || 8999, () => {
        const addrInfo = server.address();
        console.log(`Listening on port ${addrInfo.port}.`);
    });
})
    .catch((err) => {
    console.error(err);
});
//# sourceMappingURL=app.js.map
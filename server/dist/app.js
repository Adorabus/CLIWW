"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const socketIO = require("socket.io");
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
const server = http.createServer();
const io = socketIO(server);
const command = argv._.shift();
const wrapper = new wrapper_1.default({
    command,
    args: argv._
});
const messenger = new messenger_1.default(io, wrapper, argv.password);
server.listen(process.env.PORT || 8999, () => {
    const addrInfo = server.address();
    console.log(`Listening on port ${addrInfo.port}.`);
});
//# sourceMappingURL=app.js.map
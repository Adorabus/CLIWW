"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Plain"] = 0] = "Plain";
    MessageType[MessageType["Error"] = 1] = "Error";
    MessageType[MessageType["Command"] = 2] = "Command";
    MessageType[MessageType["Info"] = 3] = "Info";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
class Messenger {
    constructor(io, wrapper, options = {}) {
        this.failedAuths = {};
        this.bans = {};
        this.messages = [];
        this.io = io;
        this.wrapper = wrapper;
        this.options = options;
        io.on('connection', (client) => {
            const ipAddr = client.client.conn.remoteAddress;
            this.log(`Connection from [${ipAddr}].`);
            client.emit('authrequest');
            client.on('auth', (password) => {
                if (this.auth(client, password)) {
                    client.join('authorized');
                    client.emit('authsuccess', {
                        messages: this.messages,
                        isAlive: this.wrapper.isAlive()
                    });
                    this.log(`[${ipAddr}] authenticated.`);
                }
                else {
                    client.emit('authfail');
                }
            });
            client.on('command', (command) => {
                if (!('authorized' in client.rooms)) {
                    client.emit('authrequest');
                    return;
                }
                if (command.trim().length === 0)
                    return;
                this.broadcastMessage({
                    content: `[${ipAddr}]> ${command}`,
                    type: MessageType.Command
                });
                if (!this.wrapper.send(`${command}\n`)) {
                    this.broadcastMessage({
                        content: 'Server is not running!',
                        type: MessageType.Error
                    });
                }
            });
            client.on('disconnect', () => {
                this.log(`${ipAddr} disconnected.`);
            });
        });
        wrapper.on('start', (wrapped) => {
            wrapped.stdout
                .on('data', (data) => {
                this.broadcastMessage({
                    content: data,
                    type: MessageType.Plain
                });
            });
            wrapped.stderr
                .on('data', (data) => {
                this.broadcastMessage({
                    content: data,
                    type: MessageType.Plain
                });
            });
            wrapper
                .on('exit', (code) => {
                this.broadcast('serverstop');
                if (code === 0) {
                    const content = 'The server has exited.';
                    this.broadcastMessage({
                        content,
                        type: MessageType.Info
                    });
                    this.log(content);
                }
                else {
                    const content = `The server has crashed. [Code ${code}]`;
                    this.broadcastMessage({
                        content,
                        type: MessageType.Error
                    });
                    this.log(content);
                }
            });
        });
        wrapper
            .on('message', (content) => {
            this.log(content);
            this.broadcastMessage({
                content,
                type: MessageType.Info
            });
        });
    }
    auth(client, password) {
        if (!this.options.password)
            return true;
        const ip = client.client.conn.remoteAddress;
        // are they banned?
        if (ip in this.bans && util_1.minutesAgo(this.bans[ip]) < 10) {
            return false;
        }
        // check password
        if (password === this.options.password) {
            return true;
        }
        // make space to store failed attempts
        if (!this.failedAuths[ip])
            this.failedAuths[ip] = [];
        this.failedAuths[ip].push(Date.now());
        // keep only failed auths from the last minute
        this.failedAuths[ip] = this.failedAuths[ip].filter(failTime => util_1.minutesAgo(failTime) < 1);
        if (this.failedAuths[ip].length > 5) {
            this.bans[ip] = Date.now();
            const banMessage = `Client [${ip}] has been banned for 10 minutes.`;
            this.log(banMessage);
            this.broadcastMessage({
                content: banMessage,
                type: MessageType.Info
            });
        }
    }
    broadcastMessage(message) {
        this.messages.push(message);
        this.io.sockets.in('authorized').emit('message', message);
    }
    broadcast(event, data) {
        this.io.sockets.in('authorized').emit(event, data);
    }
    log(...args) {
        console.log(...args);
    }
}
exports.Messenger = Messenger;
//# sourceMappingURL=messenger.js.map
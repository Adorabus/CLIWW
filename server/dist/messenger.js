"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Plain"] = 0] = "Plain";
    MessageType[MessageType["Error"] = 1] = "Error";
    MessageType[MessageType["Command"] = 2] = "Command";
    MessageType[MessageType["Info"] = 3] = "Info";
    MessageType[MessageType["StdErr"] = 4] = "StdErr";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
function validNickname(nickname) {
    if (!nickname)
        return false;
    if (typeof (nickname) !== 'string')
        return false;
    if (nickname.length < 1 || nickname.length > 16)
        return false;
    return true;
}
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
                    client.emit('authsuccess');
                    client.emit('serverstate', {
                        messages: this.messages,
                        isAlive: this.wrapper.isAlive(),
                        messageLimit: options.limit || 0
                    });
                    this.log(`[${ipAddr}] authenticated.`);
                }
                else {
                    client.emit('authfail');
                }
            });
            client.on('nickname', (nickname) => {
                if (!validNickname(nickname))
                    return;
                client.nickname = nickname;
            });
            client.on('command', (command) => {
                if (!('authorized' in client.rooms)) {
                    client.emit('authrequest');
                    return;
                }
                // if (command.trim().length === 0) return
                this.broadcastMessage({
                    content: `[${client.nickname || ipAddr}]> ${command}`,
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
                    type: MessageType.StdErr
                });
            });
            this.broadcastMessage({
                content: 'Process started.',
                type: MessageType.Info
            }, true);
            this.broadcast('serverstate', {
                isAlive: true
            });
        });
        wrapper
            .on('exit', (code) => {
            this.broadcast('serverstate', {
                isAlive: false
            });
            if (code === 0) {
                const content = 'The server has exited.';
                this.broadcastMessage({
                    content,
                    type: MessageType.Info
                }, true);
            }
            else {
                const content = `The server has crashed. [Code ${code}]`;
                this.broadcastMessage({
                    content,
                    type: MessageType.Error
                }, true);
            }
        });
        wrapper
            .on('message', (content) => {
            this.broadcastMessage({
                content,
                type: MessageType.Info
            }, true);
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
            this.broadcastMessage({
                content: `Client [${ip}] has been banned for 10 minutes.`,
                type: MessageType.Info
            }, true);
        }
    }
    broadcastMessage(message, log) {
        if (this.options.limit && this.options.limit > 0) {
            if (this.messages.length === this.options.limit) {
                this.messages.shift();
            }
        }
        this.messages.push(message);
        this.io.sockets.in('authorized').emit('message', message);
        if (log) {
            this.log(message.content);
        }
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
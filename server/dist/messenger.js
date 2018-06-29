"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Plain"] = 0] = "Plain";
    MessageType[MessageType["Error"] = 1] = "Error";
    MessageType[MessageType["Command"] = 2] = "Command";
})(MessageType || (MessageType = {}));
function minutesAgo(timestamp) {
    return (Date.now() - timestamp) / 1000 / 60;
}
class Messenger {
    constructor(io, wrapper, password) {
        this.failedAuths = {};
        this.bans = {};
        this.messages = [];
        this.io = io;
        this.wrapper = wrapper;
        this.password = password;
        io.on('connection', (client) => {
            const ipAddr = client.client.conn.remoteAddress;
            console.log(`Connection from: ${ipAddr}`);
            client.on('auth', (password) => {
                if (this.auth(client, password)) {
                    client.join('authorized');
                    client.emit('authsuccess');
                }
                else {
                    client.emit('authfail');
                }
            });
            client.on('command', (command) => {
                if (!('authorized' in client.rooms))
                    return;
                if (command.trim().length === 0)
                    return;
                this.broadcast({
                    content: `[${ipAddr}]> ${command}`,
                    type: MessageType.Command
                });
                if (!this.wrapper.send(`${command}\n`)) {
                    this.broadcast({
                        content: 'Server is not running!',
                        type: MessageType.Error
                    });
                }
            });
            client.on('disconnect', () => {
                console.log(`${client.id} disconnected.`);
            });
        });
        wrapper.wrapped.stdout
            .on('data', (data) => {
            this.broadcast({
                content: data,
                type: MessageType.Plain
            });
        });
        wrapper.wrapped.stderr
            .on('data', (data) => {
            this.broadcast({
                content: data,
                type: MessageType.Plain
            });
        });
    }
    auth(client, password) {
        if (!this.password)
            return true;
        const ip = client.client.conn.remoteAddress;
        // are they banned?
        if (ip in this.bans && minutesAgo(this.bans[ip]) < 10) {
            console.log('banned');
            return false;
        }
        // check password
        if (password === this.password) {
            console.log(`${password} === ${this.password}`);
            return true;
        }
        console.log('password fail');
        // make space to store failed attempts
        if (!this.failedAuths[ip])
            this.failedAuths[ip] = [];
        this.failedAuths[ip].push(Date.now());
        // keep only failed auths from the last minute
        this.failedAuths[ip] = this.failedAuths[ip].filter(failTime => minutesAgo(failTime) < 1);
        if (this.failedAuths[ip].length > 5) {
            this.bans[ip] = Date.now();
        }
    }
    broadcast(message) {
        this.messages.push(message);
        this.io.sockets.in('authorized').emit('message', message);
    }
}
exports.default = Messenger;
//# sourceMappingURL=messenger.js.map
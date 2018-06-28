"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Plain"] = 0] = "Plain";
    MessageType[MessageType["Error"] = 1] = "Error";
    MessageType[MessageType["Command"] = 2] = "Command";
})(MessageType || (MessageType = {}));
class Messenger {
    constructor(io, wrapper) {
        this.messages = [];
        this.io = io;
        this.wrapper = wrapper;
        io.on('connection', (client) => {
            const ipAddr = client.client.conn.remoteAddress;
            console.log(`Connection from: ${ipAddr}`);
            client.on('command', (data) => {
                if (data.trim().length === 0)
                    return;
                this.broadcast({
                    content: `[${ipAddr}]> ${data}`,
                    type: MessageType.Command
                });
                if (!this.wrapper.send(`${data}\n`)) {
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
    broadcast(message) {
        this.messages.push(message);
        this.io.emit('message', message);
    }
}
exports.default = Messenger;
//# sourceMappingURL=messenger.js.map
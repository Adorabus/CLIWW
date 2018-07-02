"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child = require("child_process");
const events_1 = require("events");
class Wrapper extends events_1.EventEmitter {
    constructor(command, args = [], options = {}) {
        super();
        this._isAlive = false;
        this.command = command;
        this.args = args;
        this.options = options;
    }
    startProcess() {
        if (this._isAlive) {
            this.stopProcess(true);
        }
        const spawned = child.spawn(this.command, this.args);
        spawned.stdin.setDefaultEncoding('utf-8');
        spawned.stdout.setEncoding('utf-8');
        spawned.stderr.setEncoding('utf-8');
        if (this.options.keepalive) {
            spawned.on('exit', () => {
                setTimeout(() => {
                    this.emit('message', 'Restarting wrapped process...');
                    this.startProcess();
                }, 1000);
            });
        }
        this.wrapped = spawned;
        this._isAlive = true;
        this.emit('start', spawned);
    }
    stopProcess(force) {
        if (!this.wrapped)
            return;
        this.wrapped.kill(force ? 'SIGKILL' : 'SIGINT');
        this._isAlive = false;
        this.emit('stop');
    }
    send(command) {
        if (!this.wrapped)
            return false;
        if (this.wrapped.stdin.writable) {
            this.wrapped.stdin.write(command);
            return true;
        }
        else {
            return false;
        }
    }
    isAlive() {
        return this._isAlive;
    }
}
exports.Wrapper = Wrapper;
//# sourceMappingURL=wrapper.js.map
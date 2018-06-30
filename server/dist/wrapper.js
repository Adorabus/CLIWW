"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child = require("child_process");
class Wrapper {
    constructor(params) {
        this.launchParams = params;
        this.wrapped = child.spawn(params.command, params.args);
        this.wrapped.stdin.setDefaultEncoding('utf-8');
        this.wrapped.stdout.setEncoding('utf-8');
        this.wrapped.stderr.setEncoding('utf-8');
    }
    send(command) {
        if (this.wrapped.stdin.writable) {
            this.wrapped.stdin.write(command);
            return true;
        }
        else {
            return false;
        }
    }
    isAlive() {
        return this.wrapped.stdin.writable;
    }
}
exports.default = Wrapper;
//# sourceMappingURL=wrapper.js.map
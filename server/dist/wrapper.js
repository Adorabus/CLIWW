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
}
exports.default = Wrapper;
//# sourceMappingURL=wrapper.js.map
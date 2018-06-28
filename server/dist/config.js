"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    db: {
        type: 'sqlite',
        database: 'app.db',
        entities: [
            __dirname + "/entity/*.js"
        ],
        synchronize: true
    }
};
//# sourceMappingURL=config.js.map
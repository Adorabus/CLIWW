"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const config_1 = require("./config");
exports.default = () => {
    return typeorm_1.createConnection(config_1.default.db);
};
//# sourceMappingURL=database.js.map
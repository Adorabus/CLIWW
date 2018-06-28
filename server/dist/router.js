"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UsersController_1 = require("controllers/UsersController");
exports.default = (app, messenger) => {
    app.get('/console', (req, res) => {
        res.send({
            messages: messenger.messages
        });
    });
    app.post('/users', UsersController_1.default.createUser);
};
//# sourceMappingURL=router.js.map
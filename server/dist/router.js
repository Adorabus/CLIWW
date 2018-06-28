"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (app, messenger) => {
    app.get('/console', (req, res) => {
        res.send({
            messages: messenger.messages
        });
    });
};
//# sourceMappingURL=router.js.map
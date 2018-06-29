"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../entity/User");
exports.default = {
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username } = req.body;
            try {
                const u = new User_1.default();
                u.username = req.body.username;
                u.password = req.body.password;
                yield u.save();
                res.send(u);
            }
            catch (error) {
                console.error(error);
                res.status(409).send({
                    error: `User "${username}" already exists.`
                });
            }
        });
    },
    renameUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username } = req.params;
            try {
                const u = yield User_1.default.findOne({
                    username
                });
                u.username = req.body.newName;
                u.save();
            }
            catch (error) {
                res.status(404).send({
                    error: `User "${username} not found.`
                });
            }
        });
    }
};
//# sourceMappingURL=UsersController.js.map
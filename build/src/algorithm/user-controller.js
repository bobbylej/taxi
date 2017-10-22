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
const Boom = require("boom");
const Jwt = require("jsonwebtoken");
class UserController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
    }
    generateToken(user) {
        const jwtSecret = this.configs.jwtSecret;
        const jwtExpiration = this.configs.jwtExpiration;
        return Jwt.sign({ id: user._id }, jwtSecret, { expiresIn: jwtExpiration });
    }
    loginUser(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            const email = request.payload.email;
            const password = request.payload.password;
            let user = yield this.database.userModel.findOne({ email: email });
            if (!user) {
                return reply(Boom.unauthorized("User does not exists."));
            }
            if (!user.validatePassword(password)) {
                return reply(Boom.unauthorized("Password is invalid."));
            }
            reply({
                token: this.generateToken(user)
            });
        });
    }
    createUser(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let user = yield this.database.userModel.create(request.payload);
                return reply({ token: this.generateToken(user) }).code(201);
            }
            catch (error) {
                return reply(Boom.badImplementation(error));
            }
        });
    }
    updateUser(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = request.auth.credentials.id;
            try {
                let user = yield this.database.userModel.findByIdAndUpdate(id, { $set: request.payload }, { new: true });
                return reply(user);
            }
            catch (error) {
                return reply(Boom.badImplementation(error));
            }
        });
    }
    deleteUser(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = request.auth.credentials.id;
            let user = yield this.database.userModel.findByIdAndRemove(id);
            return reply(user);
        });
    }
    infoUser(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = request.auth.credentials.id;
            let user = yield this.database.userModel.findById(id);
            reply(user);
        });
    }
}
exports.default = UserController;
//# sourceMappingURL=user-controller.js.map
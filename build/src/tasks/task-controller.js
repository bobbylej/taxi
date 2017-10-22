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
class TaskController {
    constructor(configs, database) {
        this.configs = configs;
        this.database = database;
    }
    createTask(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = request.auth.credentials.id;
            var newTask = request.payload;
            newTask.userId = userId;
            try {
                let task = yield this.database.taskModel.create(newTask);
                return reply(task).code(201);
            }
            catch (error) {
                return reply(Boom.badImplementation(error));
            }
        });
    }
    updateTask(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = request.auth.credentials.id;
            let id = request.params["id"];
            try {
                let task = yield this.database.taskModel.findByIdAndUpdate({ _id: id, userId: userId }, { $set: request.payload }, { new: true });
                if (task) {
                    reply(task);
                }
                else {
                    reply(Boom.notFound());
                }
            }
            catch (error) {
                return reply(Boom.badImplementation(error));
            }
        });
    }
    deleteTask(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            let id = request.params["id"];
            let userId = request.auth.credentials.id;
            let deletedTask = yield this.database.taskModel.findOneAndRemove({ _id: id, userId: userId });
            if (deletedTask) {
                return reply(deletedTask);
            }
            else {
                return reply(Boom.notFound());
            }
        });
    }
    getTaskById(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = request.auth.credentials.id;
            let id = request.params["id"];
            let task = yield this.database.taskModel.findOne({ _id: id, userId: userId }).lean(true);
            if (task) {
                reply(task);
            }
            else {
                reply(Boom.notFound());
            }
        });
    }
    getTasks(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = request.auth.credentials.id;
            let top = request.query['top'];
            let skip = request.query['skip'];
            let tasks = yield this.database.taskModel.find({ userId: userId }).lean(true).skip(skip).limit(top);
            return reply(tasks);
        });
    }
}
exports.default = TaskController;
//# sourceMappingURL=task-controller.js.map
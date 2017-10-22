"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Mongoose = require("mongoose");
const user_1 = require("./users/user");
const task_1 = require("./tasks/task");
function init(config) {
    Mongoose.Promise = Promise;
    Mongoose.connect(process.env.MONGO_URL || config.connectionString);
    let mongoDb = Mongoose.connection;
    mongoDb.on('error', () => {
        console.log(`Unable to connect to database: ${config.connectionString}`);
    });
    mongoDb.once('open', () => {
        console.log(`Connected to database: ${config.connectionString}`);
    });
    return {
        taskModel: task_1.TaskModel,
        userModel: user_1.UserModel
    };
}
exports.init = init;
//# sourceMappingURL=database.js.map
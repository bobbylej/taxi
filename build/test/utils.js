"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createTaskDummy(userId, name, description) {
    var user = {
        name: name || "dummy task",
        description: description || "I'm a dummy task!"
    };
    if (userId) {
        user["userId"] = userId;
    }
    return user;
}
exports.createTaskDummy = createTaskDummy;
function createUserDummy(email) {
    var user = {
        email: email || "dummy@mail.com",
        name: "Dummy Jones",
        password: "123123"
    };
    return user;
}
exports.createUserDummy = createUserDummy;
function clearDatabase(database, done) {
    var promiseUser = database.userModel.remove({});
    var promiseTask = database.taskModel.remove({});
    Promise.all([promiseUser, promiseTask]).then(() => {
        done();
    }).catch((error) => {
        console.log(error);
    });
}
exports.clearDatabase = clearDatabase;
function createSeedTaskData(database, done) {
    return database.userModel.create(createUserDummy())
        .then((user) => {
        return Promise.all([
            database.taskModel.create(createTaskDummy(user._id, "Task 1", "Some dummy data 1")),
            database.taskModel.create(createTaskDummy(user._id, "Task 2", "Some dummy data 2")),
            database.taskModel.create(createTaskDummy(user._id, "Task 3", "Some dummy data 3")),
        ]);
    }).then((task) => {
        done();
    }).catch((error) => {
        console.log(error);
    });
}
exports.createSeedTaskData = createSeedTaskData;
function createSeedUserData(database, done) {
    database.userModel.create(createUserDummy())
        .then((user) => {
        done();
    })
        .catch((error) => {
        console.log(error);
    });
}
exports.createSeedUserData = createSeedUserData;
//# sourceMappingURL=utils.js.map
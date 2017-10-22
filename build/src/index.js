"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server = require("./server");
const Configs = require("./configurations");
console.log(`Running enviroment ${process.env.NODE_ENV || "dev"}`);
// Catch unhandling unexpected exceptions
process.on('uncaughtException', (error) => {
    console.error(`uncaughtException ${error.message}`);
});
// Catch unhandling rejected promises
process.on('unhandledRejection', (reason) => {
    console.error(`unhandledRejection ${reason}`);
});
// Init Database
const dbConfigs = Configs.getDatabaseConfig();
// const database = Database.init(dbConfigs);
// Starting Application Server
const serverConfigs = Configs.getServerConfigs();
Server.init(serverConfigs, undefined).then((server) => {
    server.start(() => {
        console.log('Server running at:', server.info.uri);
    });
});
//# sourceMappingURL=index.js.map
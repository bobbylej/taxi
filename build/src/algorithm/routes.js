"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_controller_1 = require("./algorithm-controller");
function default_1(server, serverConfigs) {
    const algorithmController = new algorithm_controller_1.default(serverConfigs);
    server.bind(algorithmController);
    server.route({
        method: 'GET',
        path: '/algorithm',
        config: {
            handler: algorithmController.index
        }
    });
    server.route({
        method: 'GET',
        path: '/distances',
        config: {
            handler: algorithmController.distances
        }
    });
    server.route({
        method: 'GET',
        path: '/simulation',
        config: {
            handler: algorithmController.simulation
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=routes.js.map
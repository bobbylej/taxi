"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const driver_1 = require("./driver");
class Node {
    constructor(node) {
        this.driver = new driver_1.default(node.driver);
        this.client = new client_1.default(node.client);
    }
}
exports.default = Node;
//# sourceMappingURL=node.1.js.map
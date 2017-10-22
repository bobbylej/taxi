"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const driver_1 = require("./driver");
class Node {
    constructor(node) {
        if (node.driver) {
            this.driver = new driver_1.default(node.driver);
        }
        if (node.client) {
            this.client = new client_1.default(node.client);
        }
    }
    get id() {
        let id = '';
        if (this.driver) {
            id += this.driver.id;
        }
        id += '-';
        if (this.client) {
            id += this.client.id;
        }
        return id;
    }
    isEqual(node) {
        return this.driver.id === node.driver.id && this.client.id === node.client.id;
    }
}
exports.default = Node;
//# sourceMappingURL=node.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("./node");
class Edge {
    constructor(edge) {
        this.weight = edge.weight;
        this.startNode = new node_1.default(edge.startNode);
        this.endNode = new node_1.default(edge.endNode);
    }
}
exports.default = Edge;
//# sourceMappingURL=edge.1.js.map
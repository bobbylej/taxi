"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("./node");
class Edge {
    constructor(edge) {
        this.weight = edge.weight;
        this.startNode = new node_1.default(edge.startNode);
        this.endNode = new node_1.default(edge.endNode);
    }
    countEdge(path, distances) {
        if (!path) {
            console.error('(Edge.ts) countEdge: path is undefined');
            return;
        }
        const startDriver = this.startNode.driver;
        const endDriver = this.endNode.driver;
        const endDriverPath = path.driversPaths[endDriver.id];
        if (!endDriverPath || !endDriverPath.length) {
            return this.getDistance(endDriver, this.endNode.client, distances);
        }
        else if (startDriver.id === endDriver.id) {
            const startClient = this.startNode.client;
            const endClient = this.endNode.client;
            return this.getDistance(startClient, startClient, distances)
                + this.getDistance(startClient, endClient, distances);
        }
        else {
            const lastClient = endDriverPath[endDriverPath.length - 1];
            const endClient = this.endNode.client;
            return this.getDistance(lastClient, lastClient, distances)
                + this.getDistance(lastClient, endClient, distances);
        }
    }
    getDistance(object1, object2, distances) {
        return distances[object1.id][object2.id].duration;
    }
}
exports.default = Edge;
//# sourceMappingURL=edge.js.map
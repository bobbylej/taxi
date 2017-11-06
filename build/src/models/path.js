"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const edge_1 = require("./edge");
class Path {
    constructor(path) {
        this.weight = path.weight;
        this.edges = path.edges || [];
        this.driversPaths = path.driversPaths || {};
    }
    countPath() {
        let pathWeight = 0;
        this.edges.forEach(edge => {
            if (edge.weight === undefined) {
                console.error('(Path.ts) countPath: edge.weight is undefined');
                return;
            }
            pathWeight += edge.weight;
        });
        return pathWeight;
    }
    addEdgeToPath(edge) {
        const endDriver = edge.endNode.driver;
        let endDriverPath = this.driversPaths[endDriver.id];
        const endClient = edge.endNode.client;
        if (!endDriverPath) {
            this.driversPaths[endDriver.id] = new Array();
        }
        this.driversPaths[endDriver.id].push(endClient);
        this.edges.push(edge);
    }
    clone() {
        const edges = this.edges.map(edge => new edge_1.default(edge));
        const driversPaths = {};
        for (let key in this.driversPaths) {
            if (this.driversPaths.hasOwnProperty(key)) {
                driversPaths[key] = this.driversPaths[key].slice(0);
            }
        }
        return new Path({
            edges,
            driversPaths
        });
    }
    toString() {
        let pathEdges = '';
        pathEdges += this.edges[0].startNode.id;
        this.edges.forEach((edge) => {
            pathEdges += ' -' + '-> ' + edge.endNode.id;
        });
        return pathEdges;
    }
}
exports.default = Path;
//# sourceMappingURL=path.js.map
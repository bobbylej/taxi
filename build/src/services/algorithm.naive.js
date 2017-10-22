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
const edge_1 = require("./../models/edge");
const node_1 = require("./../models/node");
const path_1 = require("./../models/path");
// Services
const algorithm_1 = require("./algorithm");
class AlgorithmNaive extends algorithm_1.Algorithm {
    constructor(clients, drivers, distances) {
        super(clients, drivers, distances);
        this.iterations = 0;
    }
    findBestPath() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.distances) {
                this.distances = yield this.getDistances();
            }
            this.iterations = 0;
            this.startTime = new Date().getTime();
            let path = new path_1.default({});
            this.findPaths(this.nodes);
            this.algorithmTime = new Date().getTime() - this.startTime;
            console.log('Naive - iterations', this.iterations, Object.keys(this.nodes).length);
            this.logPath(this.bestPath);
            return this.bestPath;
        });
    }
    findPaths(searchNodes, nodes, prevNode) {
        let availableNodes = Object.assign({}, searchNodes);
        if (!nodes) {
            nodes = new Array();
        }
        if (prevNode) {
            delete availableNodes[prevNode.client.id];
        }
        for (let key in availableNodes) {
            if (availableNodes.hasOwnProperty(key)) {
                const clientNodes = availableNodes[key];
                clientNodes.forEach(node => {
                    const nodesCopy = nodes.slice(0);
                    nodesCopy.push(node);
                    if (nodesCopy.length === Object.keys(this.nodes).length) {
                        const path = this.createPath(nodesCopy);
                        // if (path.toString().indexOf('d4-c1 --> d3-c5 --> d1-c4 --> d4-c3 --> d5-c2') !== -1) {
                        //   console.log('OK', JSON.stringify(path));
                        // }
                        this.iterations++;
                        if (!this.bestPath || this.bestPath.weight > path.weight) {
                            this.bestPath = path;
                            this.bestPathFindTime = new Date().getTime() - this.startTime;
                        }
                    }
                    else {
                        this.findPaths(availableNodes, nodesCopy, node);
                    }
                });
            }
            else {
                return;
            }
        }
    }
    createPath(nodes) {
        const path = new path_1.default({});
        let prevNode = new node_1.default({});
        nodes.forEach(node => {
            let edge = new edge_1.default({
                startNode: prevNode,
                endNode: node
            });
            edge.weight = edge.countEdge(path, this.distances);
            path.addEdgeToPath(edge);
            prevNode = node;
        });
        path.weight = path.countPath();
        return path;
    }
}
exports.AlgorithmNaive = AlgorithmNaive;
//# sourceMappingURL=algorithm.naive.js.map
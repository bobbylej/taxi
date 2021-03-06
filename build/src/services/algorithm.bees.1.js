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
class AlgorithmBees extends algorithm_1.Algorithm {
    constructor(clients, drivers, distances) {
        super(clients, drivers, distances);
        this.initialExhaustedValue = 4;
        this.modifiesPathAmount = 2;
        this.beesAmount = 10;
        this.iterationAmount = 300;
    }
    findBestPath() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.distances) {
                this.distances = yield this.getDistances();
            }
            this.initExhaustedValues();
            this.generateInitialPaths();
            for (let i = 0; i < this.iterationAmount; i++) {
                this.explorePaths();
                this.explorePathsWithProbability();
                this.findNewPath();
                this.getBastPath();
            }
            return this.bestPath;
        });
    }
    initExhaustedValues() {
        this.exhaustedValues = new Array();
        for (let i = 0; i < this.beesAmount; i++) {
            this.exhaustedValues.push(this.initialExhaustedValue);
        }
    }
    generateInitialPaths() {
        this.paths = new Array();
        for (let i = 0; i < this.beesAmount; i++) {
            const path = this.findRandomPath();
            this.paths.push(path);
        }
    }
    explorePaths() {
        for (let i = 0; i < this.beesAmount; i++) {
            let path = this.modifyPath(this.paths[i]);
            path.weight = path.countPath();
            if (this.paths[i].weight > path.weight) {
                this.paths[i] = path;
                this.exhaustedValues[i] = this.initialExhaustedValue;
            }
            else {
                this.exhaustedValues[i]--;
            }
        }
    }
    explorePathsWithProbability() {
        const newPaths = Object.assign([], this.paths);
        for (let i = 0; i < this.beesAmount; i++) {
            let path = this.modifyPath(this.findPath());
            path.weight = path.countPath();
            if (this.paths[i].weight > path.weight) {
                newPaths[i] = path;
                this.exhaustedValues[i] = this.initialExhaustedValue;
            }
        }
        this.paths = newPaths;
    }
    findNewPath() {
        for (let i = 0; i < this.beesAmount; i++) {
            if (this.exhaustedValues[i] <= 0) {
                const path = this.findRandomPath();
                this.paths[i] = path;
                this.exhaustedValues[i] = this.initialExhaustedValue;
            }
        }
    }
    getBastPath() {
        for (let i = 0; i < this.beesAmount; i++) {
            if (!this.bestPath || this.bestPath.weight > this.paths[i].weight) {
                this.bestPath = new path_1.default(this.paths[i]);
            }
        }
        return this.bestPath;
    }
    logPath(path) {
        let pathEdges = '';
        path.edges.forEach((edge) => {
            pathEdges += ' -' + '-> ' + edge.endNode.driver.id + edge.endNode.client.id;
        });
        console.log(pathEdges, path.weight);
    }
    findPath() {
        let sumOfValues = 0;
        this.paths.forEach((path) => {
            sumOfValues += path.weight;
        });
        let randomValue = Math.random() * sumOfValues;
        for (let i = 0; i < this.paths.length; i++) {
            randomValue -= this.paths[i].weight;
            if (randomValue <= 0) {
                return this.paths[i];
            }
        }
        return this.paths[this.paths.length - 1];
    }
    findRandomPath() {
        const path = new path_1.default({});
        let availableNodes = Object.assign({}, this.nodes);
        const nodesAmount = Object.keys(availableNodes).length;
        const startNode = new node_1.default({});
        for (let n = 0; n < nodesAmount; n++) {
            let currentNode;
            if (n === 0) {
                currentNode = startNode;
            }
            else {
                currentNode = path.edges[n - 1].endNode;
            }
            const edge = this.findNextEdge(path, currentNode, availableNodes);
            path.addEdgeToPath(edge);
            delete availableNodes[edge.endNode.client.id];
        }
        path.weight = path.countPath();
        return path;
    }
    findNextEdge(path, currentNode, nodes) {
        const nextNode = this.findRandomNode(nodes);
        let edge = new edge_1.default({
            startNode: currentNode,
            endNode: nextNode
        });
        edge.weight = edge.countEdge(path, this.distances);
        return edge;
    }
    findRandomNode(nodes) {
        const clients = Object.keys(nodes);
        const clientsAmount = clients.length;
        const clientId = clients[Math.floor(Math.random() * clientsAmount)];
        const drivers = nodes[clientId];
        const driversAmount = drivers.length;
        const driverId = Math.floor(Math.random() * driversAmount);
        return nodes[clientId][driverId];
    }
    modifyPath(path) {
        const newPath = new path_1.default(path);
        const edgesAmount = newPath.edges.length;
        for (let i = 0; i < this.modifiesPathAmount; i++) {
            const nodeIndex1 = this.getRandomIndexNodeFromPath(newPath);
            let nodeIndex2 = this.getRandomIndexNodeFromPath(newPath);
            while (nodeIndex1.node.isEqual(nodeIndex2.node)) {
                nodeIndex2 = this.getRandomIndexNodeFromPath(newPath);
            }
            this.modifyNode(newPath, nodeIndex1, nodeIndex2.node);
            this.modifyNode(newPath, nodeIndex2, nodeIndex1.node);
            // this.replaceNode(newPath, nodeIndex1, nodeIndex2.node);
            // this.replaceNode(newPath, nodeIndex2, nodeIndex1.node);
        }
        return newPath;
    }
    getRandomIndexNodeFromPath(path) {
        const edgesAmount = path.edges.length - 1;
        const edgeIndex = Math.floor(Math.random() * edgesAmount + 1);
        const nodeType = Math.random() < 0.5 ? 'startNode' : 'endNode';
        return {
            index: {
                edge: edgeIndex,
                node: nodeType
            },
            node: new node_1.default(path.edges[edgeIndex][nodeType])
        };
    }
    replaceNode(path, nodeIndex1, node) {
        path.edges[nodeIndex1.index.edge][nodeIndex1.index.node] = node;
        if (nodeIndex1.index.node === 'startNode' && nodeIndex1.index.edge > 0) {
            path.edges[nodeIndex1.index.edge - 1].endNode = node;
        }
        else if (nodeIndex1.index.node === 'endNode' && nodeIndex1.index.edge < path.edges.length - 1) {
            path.edges[nodeIndex1.index.edge + 1].startNode = node;
        }
    }
    modifyNode(path, nodeIndex1, node) {
        path.edges[nodeIndex1.index.edge][nodeIndex1.index.node].driver = node.driver;
        if (nodeIndex1.index.node === 'startNode' && nodeIndex1.index.edge > 0) {
            path.edges[nodeIndex1.index.edge - 1].endNode.driver = node.driver;
        }
        else if (nodeIndex1.index.node === 'endNode' && nodeIndex1.index.edge < path.edges.length - 1) {
            path.edges[nodeIndex1.index.edge + 1].startNode.driver = node.driver;
        }
    }
}
exports.AlgorithmBees = AlgorithmBees;
//# sourceMappingURL=algorithm.bees.1.js.map
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
        this.initialExhaustedValue = 10;
        this.modifiesPathAmount = 3;
        this.beesAmount = 40;
        this.iterationAmount = 1100;
    }
    findBestPath(getDistances, getAllDistances) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.distances || getDistances) {
                this.distances = Object.assign(this.distances, yield this.getDistances(getAllDistances));
            }
            this.startTime = new Date().getTime();
            this.initExhaustedValues();
            this.generateInitialPaths();
            // for (let i = 0; i < this.iterationAmount && this.isTimeUp(); i++) {
            for (let i = 0; !this.isTimeUp(); i++) {
                console.log('check0');
                this.explorePaths();
                console.log('check1');
                this.explorePathsWithProbability();
                console.log('check2');
                this.findNewPath();
                console.log('check3');
                this.getBestPath();
                console.log('check4');
            }
            this.algorithmTime = new Date().getTime() - this.startTime;
            console.log('Bees');
            console.log(this.bestPath.toString());
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
            console.log('explorePaths', this.paths[i]);
            let path = this.modifyPath(this.paths[i]);
            console.log('explorePaths', path);
            path.weight = path.countPath();
            console.log('explorePaths', path.weight);
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
            else {
                this.exhaustedValues[i]--;
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
    getBestPath() {
        for (let i = 0; i < this.beesAmount; i++) {
            if (!this.bestPath || this.bestPath.weight > this.paths[i].weight) {
                this.bestPath = new path_1.default(this.paths[i]);
                this.bestPathFindTime = new Date().getTime() - this.startTime;
            }
        }
        return this.bestPath;
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
        if (path.edges.length > 1) {
            const edges = path.edges.map(edge => new edge_1.default(edge));
            const edgesAmount = edges.length;
            for (let i = 0; i < this.modifiesPathAmount; i++) {
                const nodeIndex1 = this.getRandomIndexNodeFromPath(edges);
                let nodeIndex2 = this.getRandomIndexNodeFromPath(edges);
                while (nodeIndex1.node.isEqual(nodeIndex2.node)) {
                    nodeIndex2 = this.getRandomIndexNodeFromPath(edges);
                }
                this.modifyNode(edges, nodeIndex1.index.edge, nodeIndex2.node);
                this.modifyNode(edges, nodeIndex2.index.edge, nodeIndex1.node);
                // this.replaceNode(edges, nodeIndex1.index.edge, nodeIndex2.node);
                // this.replaceNode(edges, nodeIndex2.index.edge, nodeIndex1.node);
            }
            const newPath = new path_1.default({});
            edges.forEach(edge => {
                edge.weight = edge.countEdge(newPath, this.distances);
                newPath.addEdgeToPath(edge);
            });
            return newPath;
        }
        return path;
    }
    getRandomIndexNodeFromPath(edges) {
        const edgesAmount = edges.length;
        const edgeIndex = Math.floor(Math.random() * edgesAmount);
        const nodeType = 'endNode';
        return {
            index: {
                edge: edgeIndex,
                node: nodeType
            },
            node: new node_1.default(edges[edgeIndex][nodeType])
        };
    }
    replaceNode(edges, edgeIndex, node) {
        edges[edgeIndex].endNode = node;
        if (edgeIndex < edges.length - 1) {
            edges[edgeIndex + 1].startNode = node;
        }
    }
    modifyNode(edges, edgeIndex, node) {
        edges[edgeIndex].endNode.driver = node.driver;
        if (edgeIndex < edges.length - 1) {
            edges[edgeIndex + 1].startNode.driver = node.driver;
        }
    }
}
exports.AlgorithmBees = AlgorithmBees;
//# sourceMappingURL=algorithm.bees.js.map
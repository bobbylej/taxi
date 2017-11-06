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
class AlgorithmGenetic extends algorithm_1.Algorithm {
    constructor(clients, drivers, distances) {
        super(clients, drivers, distances);
        this.crossoverProbability = 0.8;
        this.mutationProbability = 0.9;
        this.gentypesAmount = 320;
        this.iterationAmount = 100;
    }
    findBestPath() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.distances) {
                this.distances = yield this.getDistances();
            }
            this.startTime = new Date().getTime();
            this.generateInitialPaths();
            // for (let i = 0; i < this.iterationAmount && this.isTimeUp(); i++) {
            for (let i = 0; this.isTimeUp(); i++) {
                this.selectPaths();
                this.crossoverPaths();
                this.mutatePaths();
                this.getBestPath();
            }
            this.algorithmTime = new Date().getTime() - this.startTime;
            console.log('Genetic');
            console.log(this.bestPath.toString());
            return this.bestPath;
        });
    }
    generateInitialPaths() {
        this.paths = new Array();
        for (let i = 0; i < this.gentypesAmount; i++) {
            const path = this.findRandomPath();
            this.paths.push(path);
        }
    }
    selectPaths() {
        const newPaths = new Array();
        const sumOfWeights = this.getSumOfWeights();
        for (let i = 0; i < this.paths.length; i++) {
            newPaths.push(this.selectPath(sumOfWeights));
        }
        this.paths = newPaths;
    }
    selectPath(sumOfWeights) {
        let randomValue = Math.random() * sumOfWeights;
        for (let i = 0; i < this.paths.length; i++) {
            randomValue -= this.paths[i].weight;
            if (randomValue <= 0) {
                return this.paths[i];
            }
        }
    }
    crossoverPaths() {
        const newPaths = new Array();
        for (let i = 0; i < this.gentypesAmount / 2; i++) {
            const genotype1 = this.getRandomPath();
            const genotype2 = this.getRandomPath();
            const probability = Math.random();
            if (probability < this.crossoverProbability) {
                const edges1 = genotype1.edges.map(edge => new edge_1.default(edge));
                const edges2 = genotype2.edges.map(edge => new edge_1.default(edge));
                const index = this.getRandomNodeIndexFromPath(genotype1);
                const halfIndex = genotype1.edges.length / 2;
                let startIndex, endIndex;
                if (index < halfIndex) {
                    startIndex = 0;
                    endIndex = index;
                }
                else {
                    startIndex = index;
                    endIndex = genotype1.edges.length;
                }
                for (let j = startIndex; j < endIndex; j++) {
                    this.crossoverNode(edges1, genotype2.edges, j);
                    this.crossoverNode(edges2, genotype1.edges, j);
                }
                const path1 = new path_1.default({});
                edges1.forEach(edge => {
                    edge.weight = edge.countEdge(path1, this.distances);
                    path1.addEdgeToPath(edge);
                });
                path1.weight = path1.countPath();
                newPaths.push(path1);
                const path2 = new path_1.default({});
                edges2.forEach(edge => {
                    edge.weight = edge.countEdge(path2, this.distances);
                    path2.addEdgeToPath(edge);
                });
                path2.weight = path2.countPath();
                newPaths.push(path2);
            }
            else {
                newPaths.push(genotype1);
                newPaths.push(genotype2);
            }
        }
        this.paths = newPaths;
    }
    crossoverNode(edges, newEdges, index) {
        let oldNode = edges[index].endNode;
        let newNode = newEdges[index].endNode;
        let similarNodeIndex = this.getNodeIndexWithClient(edges, newNode.client);
        this.replaceNode(edges, index, newNode);
        if (index !== similarNodeIndex) {
            this.replaceNode(edges, similarNodeIndex, oldNode);
        }
    }
    mutatePaths() {
        const newPaths = new Array();
        for (let i = 0; i < this.gentypesAmount; i++) {
            newPaths.push(this.mutatePath(this.paths[i]));
        }
        this.paths = newPaths;
    }
    mutatePath(path) {
        const edges = path.edges.map(edge => new edge_1.default(edge));
        for (let i = 0; i < edges.length; i++) {
            const probability = Math.random();
            if (probability < this.mutationProbability) {
                const newNode = this.mutateNode(edges[i].endNode);
                this.replaceNode(edges, i, newNode);
            }
        }
        const newPath = new path_1.default({});
        edges.forEach(edge => {
            edge.weight = edge.countEdge(newPath, this.distances);
            newPath.addEdgeToPath(edge);
        });
        newPath.weight = newPath.countPath();
        return newPath;
    }
    mutateNode(node) {
        let driver = this.getRandomDriver();
        while (!this.canDriverGetClient(node.client, driver)) {
            driver = this.getRandomDriver();
        }
        node.driver = driver;
        return node;
    }
    getBestPath() {
        for (let i = 0; i < this.gentypesAmount; i++) {
            if (!this.bestPath || this.bestPath.weight > this.paths[i].weight) {
                this.bestPath = new path_1.default(this.paths[i]);
                this.bestPathFindTime = new Date().getTime() - this.startTime;
            }
        }
        return this.bestPath;
    }
    getRandomDriver() {
        return this.drivers[Math.floor(Math.random() * this.drivers.length)];
    }
    getRandomPath() {
        return this.paths[Math.floor(Math.random() * this.paths.length)];
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
    getSumOfWeights() {
        let sumOfWeights = 0;
        this.paths.forEach(path => {
            sumOfWeights += path.weight;
        });
        return sumOfWeights;
    }
    getNodeIndexWithClient(edges, client) {
        for (let i = 0; i < edges.length; i++) {
            if (edges[i].endNode.client.id === client.id) {
                return i;
            }
        }
    }
    getRandomNodeIndexFromPath(path) {
        const edgesAmount = path.edges.length;
        const edgeIndex = Math.floor(Math.random() * (edgesAmount - 2) + 1);
        return edgeIndex;
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
exports.AlgorithmGenetic = AlgorithmGenetic;
//# sourceMappingURL=algorithm.genetic.js.map
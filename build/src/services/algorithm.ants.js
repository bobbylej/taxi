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
class AlgorithmAnts extends algorithm_1.Algorithm {
    // iterationAmount = 300;
    // minIterationAmount = 1;
    constructor(clients, drivers, distances) {
        super(clients, drivers, distances);
        this.pheromonDecayCoefficient = 0.25;
        this.pheromonLocalDecayCoefficient = 0.1;
        this.betterEdgeCoefficient = 0.5;
        this.importanceInformation = 2;
        this.antsAmount = 40;
    }
    findBestPath(getDistances, getAllDistances) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.distances || getDistances) {
                this.distances = Object.assign(this.distances, yield this.getDistances(getAllDistances));
            }
            // this.startTime = new Date().getTime();
            this.initPheromones();
            // this.algorithmTime = new Date().getTime() - this.startTime;
            // console.log('Time init', this.algorithmTime);
            this.startTime = new Date().getTime();
            // for (let i = 0; i < this.iterationAmount && this.isTimeUp(); i++) {
            for (let i = 0; !this.isTimeUp(); i++) {
                for (let m = 0; m < this.antsAmount; m++) {
                    this.runAnt();
                }
                this.globalUpdatePheromones();
            }
            this.algorithmTime = new Date().getTime() - this.startTime;
            // console.log('Ants');
            // console.log(this.bestPath.toString());
            return this.bestPath;
        });
    }
    runAnt() {
        const path = this.findPath();
        if (!this.bestPath || this.bestPath.weight > path.weight) {
            this.bestPath = path;
            this.bestPathFindTime = new Date().getTime() - this.startTime;
        }
    }
    findPath() {
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
            this.localUpdatePheromones(path, edge, availableNodes);
            delete availableNodes[edge.endNode.client.id];
        }
        path.weight = path.countPath();
        return path;
    }
    findPathByNearestNeighbour(path, edge, nodes) {
        const wholePath = path.clone();
        let availableNodes = Object.assign({}, nodes);
        wholePath.addEdgeToPath(edge);
        delete availableNodes[edge.endNode.client.id];
        const nodesAmount = Object.keys(availableNodes).length;
        const startNode = edge.endNode;
        for (let n = 0; n < nodesAmount; n++) {
            let currentNode;
            if (n === 0) {
                currentNode = startNode;
            }
            else {
                currentNode = wholePath.edges[n - 1].endNode;
            }
            const nextEdge = this.findNextNearestEdge(wholePath, currentNode, availableNodes);
            wholePath.addEdgeToPath(nextEdge);
            delete availableNodes[nextEdge.endNode.client.id];
        }
        wholePath.weight = wholePath.countPath();
        return wholePath;
    }
    findNextEdge(path, currentNode, nodes) {
        const edgesToChoose = this.generateEdgesToChoose(path, currentNode, nodes);
        const randomBetterEdgeCoefficient = Math.random();
        if (randomBetterEdgeCoefficient <= this.betterEdgeCoefficient) {
            return this.findBestEdge(edgesToChoose);
        }
        else {
            return this.findRandomEdge(edgesToChoose);
        }
    }
    findNextNearestEdge(path, currentNode, nodes) {
        const edgesToChoose = this.generateEdgesToChooseNearest(path, currentNode, nodes);
        return this.findNearestEdge(edgesToChoose);
    }
    findNearestEdge(edgesToChoose) {
        let bestEdge;
        for (let key in edgesToChoose) {
            if (edgesToChoose.hasOwnProperty(key)) {
                let edge = edgesToChoose[key];
                if (!bestEdge || bestEdge.weight < edge.weight) {
                    bestEdge = edge;
                }
            }
        }
        return bestEdge;
    }
    findBestEdge(edgesToChoose) {
        let bestEdge = {
            edge: undefined,
            value: 0
        };
        for (let key in edgesToChoose) {
            if (edgesToChoose.hasOwnProperty(key)) {
                let edge = edgesToChoose[key];
                if (bestEdge.value < edge.value) {
                    bestEdge = edge;
                }
            }
        }
        return bestEdge.edge;
    }
    findRandomEdge(edgesToChoose) {
        let sumOfValues = 0;
        edgesToChoose.forEach(edge => {
            sumOfValues += edge.value;
        });
        let randomValue = Math.random() * sumOfValues;
        for (let key in edgesToChoose) {
            if (edgesToChoose.hasOwnProperty(key)) {
                randomValue -= edgesToChoose[key].value;
                if (randomValue <= 0) {
                    return edgesToChoose[key].edge;
                }
            }
        }
        return edgesToChoose[edgesToChoose.length - 1].edge;
    }
    generateEdgesToChoose(path, currentNode, nodes) {
        const edgesToChoose = new Array();
        for (let key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                const clientNodes = nodes[key];
                clientNodes.forEach(node => {
                    let edge = new edge_1.default({
                        startNode: currentNode,
                        endNode: node
                    });
                    edge.weight = edge.countEdge(path, this.distances);
                    let value = this.pheromones[currentNode.id][node.id] * Math.pow(1 / edge.weight, this.importanceInformation);
                    edgesToChoose.push({ edge, value });
                });
            }
        }
        return edgesToChoose;
    }
    generateEdgesToChooseNearest(path, currentNode, nodes) {
        const edgesToChoose = new Array();
        for (let key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                const clientNodes = nodes[key];
                clientNodes.forEach(node => {
                    let edge = new edge_1.default({
                        startNode: currentNode,
                        endNode: node
                    });
                    edge.weight = edge.countEdge(path, this.distances);
                    edgesToChoose.push(edge);
                });
            }
        }
        return edgesToChoose;
    }
    initPheromones() {
        this.pheromones = {};
        if (this.nodes) {
            const startNode = new node_1.default();
            this.pheromones[startNode.id] = {};
            for (var key1 in this.nodes) {
                if (this.nodes.hasOwnProperty(key1)) {
                    const clientNodes1 = this.nodes[key1];
                    clientNodes1.forEach(node1 => {
                        const path = new path_1.default();
                        const edge = new edge_1.default({
                            startNode,
                            endNode: new node_1.default({
                                driver: node1.driver,
                                client: node1.client
                            })
                        });
                        edge.weight = edge.countEdge(path, this.distances);
                        const availableNodes = Object.assign({}, this.nodes);
                        delete availableNodes[node1.client.id];
                        this.pheromones[startNode.id][node1.id] = this.getInitPheromone(path, edge, availableNodes);
                        if (!this.pheromones[node1.id]) {
                            this.pheromones[node1.id] = {};
                        }
                        for (var key2 in this.nodes) {
                            if (this.nodes.hasOwnProperty(key2) && key1 !== key2) {
                                const clientNodes2 = this.nodes[key2];
                                clientNodes2.forEach(node2 => {
                                    const path = new path_1.default();
                                    const startEdge = new edge_1.default({
                                        startNode,
                                        endNode: new node_1.default({
                                            driver: node1.driver,
                                            client: node1.client
                                        })
                                    });
                                    startEdge.weight = startEdge.countEdge(path, this.distances);
                                    path.addEdgeToPath(startEdge);
                                    const edge = new edge_1.default({
                                        startNode: node1,
                                        endNode: new node_1.default({
                                            driver: node2.driver,
                                            client: node2.client
                                        })
                                    });
                                    edge.weight = edge.countEdge(path, this.distances);
                                    const availableNodes = Object.assign({}, this.nodes);
                                    delete availableNodes[node1.client.id];
                                    delete availableNodes[node2.client.id];
                                    this.pheromones[node1.id][node2.id] = this.getInitPheromone(path, edge, availableNodes);
                                });
                            }
                        }
                    });
                }
            }
        }
        return this.pheromones;
    }
    globalUpdatePheromones() {
        this.bestPath.edges.forEach((edge) => {
            const pheromone = this.pheromones[edge.startNode.id][edge.endNode.id];
            this.pheromones[edge.startNode.id][edge.endNode.id] = this.getGlobalUpdatedPheromone(pheromone);
        });
    }
    getGlobalUpdatedPheromone(pheromone) {
        return (1 - this.pheromonDecayCoefficient) * pheromone + this.pheromonDecayCoefficient * (1 / this.bestPath.weight);
    }
    localUpdatePheromones(path, edge, nodes) {
        this.pheromones[edge.startNode.id][edge.endNode.id] = this.getLocalUpdatedPheromone(path, edge, nodes);
    }
    getLocalUpdatedPheromone(path, edge, nodes) {
        const availableNodes = Object.assign({}, nodes);
        delete availableNodes[edge.endNode.client.id];
        const nodesAmount = Object.keys(availableNodes).length;
        let nearestEdgeWeight = 0;
        if (nodesAmount > 0) {
            nearestEdgeWeight = this.findNextNearestEdge(path, edge.endNode, availableNodes).weight;
        }
        const pheromonInitialValue = 1 / (nearestEdgeWeight * nodesAmount + path.countPath());
        const pheromone = this.pheromones[edge.startNode.id][edge.endNode.id];
        return (1 - this.pheromonLocalDecayCoefficient) * pheromone + this.pheromonLocalDecayCoefficient * pheromonInitialValue;
    }
    getInitPheromone(path, edge, nodes) {
        let pheromonInitialValue = 1 / edge.weight;
        if (Object.keys(nodes).length > 0) {
            const nearestEdge = this.findNextNearestEdge(path, edge.endNode, nodes);
            pheromonInitialValue = 1 / (nearestEdge.weight * Object.keys(this.nodes).length);
        }
        return this.pheromonDecayCoefficient * pheromonInitialValue;
    }
}
exports.AlgorithmAnts = AlgorithmAnts;
//# sourceMappingURL=algorithm.ants.js.map
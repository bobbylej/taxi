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
const google_service_1 = require("./google.service");
const helper_service_1 = require("./helper.service");
class Algorithm {
    constructor(clients, drivers, distances) {
        this.algorithmMaxTime = 1000;
        this.clients = clients;
        this.drivers = drivers;
        this.nodes = this.generateNodes();
        this.distances = distances;
    }
    findPath() {
        const path = new path_1.default({});
        let availableNodes = Object.assign({}, this.nodes);
        const nodesAmount = Object.keys(availableNodes).length;
        const startNode = this.findStartNode();
        for (let n = 0; n < nodesAmount; n++) {
            let prevNode;
            if (n === 0) {
                prevNode = startNode;
            }
            else {
                prevNode = path.edges[n - 1].endNode;
            }
            const nextNode = this.findNextNode(availableNodes);
            const edge = new edge_1.default({
                startNode: prevNode,
                endNode: nextNode
            });
            edge.weight = edge.countEdge(path, this.distances);
            path.addEdgeToPath(edge);
            delete availableNodes[nextNode.client.id];
        }
        path.weight = path.countPath();
        return path;
    }
    findNextNode(nodes) {
        const clientsIds = Object.keys(nodes);
        const clientsNodes = nodes[clientsIds[Math.floor(clientsIds.length * Math.random())]];
        return clientsNodes[Math.floor(clientsNodes.length * Math.random())];
    }
    findStartNode() {
        const driver = this.drivers[Math.floor(this.drivers.length * Math.random())];
        return new node_1.default({ driver });
    }
    generateNodes() {
        const nodes = {};
        if (this.clients && this.drivers) {
            this.clients.forEach(client => {
                if (!nodes[client.id]) {
                    nodes[client.id] = new Array();
                }
                this.drivers.forEach(driver => {
                    if (this.canDriverGetClient(client, driver)) {
                        nodes[client.id].push(new node_1.default({ driver, client }));
                    }
                });
            });
        }
        return nodes;
    }
    canDriverGetClient(client, driver) {
        if (client.params && client.params.length) {
            if (!(driver.params && driver.params.length)) {
                return false;
            }
            return helper_service_1.helperService.isSuperArray(driver.params, client.params);
        }
        return true;
    }
    getDistances() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('getDistances; clients: ', this.clients.length, 'taxi: ', this.drivers.length);
            const finalDistances = {};
            const promises = new Array();
            let promiseAmount = 0;
            if (this.clients) {
                this.clients.forEach((client1) => {
                    let origins = [];
                    let destinations = [];
                    origins.push({
                        id: client1.id,
                        location: client1.startLocation
                    });
                    destinations.push({
                        id: client1.id,
                        location: client1.endLocation
                    });
                    // promises.push(googleService.getGoogleDistances(origins, destinations).then(distances => {
                    //   // tslint:disable-next-line:forin
                    //   for (let key in distances) {
                    //     if (!finalDistances[key]) {
                    //       finalDistances[key] = {};
                    //     }
                    //     Object.assign(finalDistances[key], distances[key]);
                    //   }
                    // }));
                    origins = [];
                    destinations = [];
                    origins.push({
                        id: client1.id,
                        location: client1.endLocation
                    });
                    this.clients.forEach((client2) => {
                        if (client1.id !== client2.id) {
                            destinations.push({
                                id: client2.id,
                                location: client2.startLocation
                            });
                        }
                    });
                    // promises.push(googleService.getGoogleDistances(origins, destinations).then(distances => {
                    //   // tslint:disable-next-line:forin
                    //   for (let key in distances) {
                    //     if (!finalDistances[key]) {
                    //       finalDistances[key] = {};
                    //     }
                    //     Object.assign(finalDistances[key], distances[key]);
                    //     console.log('--------------------------------------------------------------------');
                    //     console.log(JSON.stringify(finalDistances));
                    //   }
                    // }));
                });
            }
            if (this.drivers) {
                const destinations = [];
                this.drivers.forEach(driver => {
                    const origins = [];
                    origins.push({
                        id: driver.id,
                        location: driver.location
                    });
                    this.clients.forEach(client => {
                        destinations.push({
                            id: client.id,
                            location: client.startLocation
                        });
                    });
                    promises.push(google_service_1.googleService.getGoogleDistances(origins, destinations)
                        .then(distances => {
                        Object.assign(finalDistances, distances);
                        console.log('--------------------------------------------------------------------');
                        console.log(JSON.stringify(finalDistances));
                    }));
                });
            }
            return new Promise((resolve, reject) => {
                Promise.all(promises).then((values) => {
                    console.log('getDistances finished;');
                    return resolve(finalDistances);
                })
                    .catch(error => {
                    console.error(error);
                    return reject(error);
                });
            });
        });
    }
    isTimeUp() {
        return new Date().getTime() - this.startTime < this.algorithmMaxTime;
    }
}
exports.Algorithm = Algorithm;
//# sourceMappingURL=algorithm.js.map
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
const gapi = require("@google/maps");
const distance_1 = require("./../models/distance");
const edge_1 = require("./../models/edge");
const node_1 = require("./../models/node");
const path_1 = require("./../models/path");
class Algorithm {
    constructor(clients, drivers, distances) {
        this.algorithmMaxTime = 1000;
        this.initGoogleApi();
        this.clients = clients;
        this.drivers = drivers;
        this.nodes = this.generateNodes();
        this.distances = distances;
    }
    initGoogleApi() {
        this.googleMapsClient = gapi.createClient({
            key: 'AIzaSyAPWbCNIq7JkMMH15K2H8EDzSCZwUD2JNI'
        });
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
            return this.isSuperArray(driver.params, client.params);
        }
        return true;
    }
    getDistances() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    promises.push(this.getGoogleDistances(origins, destinations).then(distances => {
                        // tslint:disable-next-line:forin
                        for (let key in distances) {
                            if (!finalDistances[key]) {
                                finalDistances[key] = {};
                            }
                            Object.assign(finalDistances[key], distances[key]);
                        }
                    }));
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
                    promises.push(this.getGoogleDistances(origins, destinations).then(distances => {
                        // tslint:disable-next-line:forin
                        for (let key in distances) {
                            if (!finalDistances[key]) {
                                finalDistances[key] = {};
                            }
                            Object.assign(finalDistances[key], distances[key]);
                        }
                    }));
                });
            }
            if (this.drivers) {
                const origins = [];
                const destinations = [];
                this.drivers.forEach(driver => {
                    origins.push({
                        id: driver.id,
                        location: driver.location
                    });
                });
                this.clients.forEach(client => {
                    destinations.push({
                        id: client.id,
                        location: client.startLocation
                    });
                });
                promises.push(this.getGoogleDistances(origins, destinations).then(distances => {
                    return Object.assign(finalDistances, distances);
                }));
            }
            return new Promise((resolve, reject) => {
                Promise.all(promises).then((values) => {
                    return resolve(finalDistances);
                });
            });
        });
    }
    getGoogleDistance(location1, location2) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                this.googleMapsClient.distanceMatrix({
                    origins: { lat: location1.lat, lng: location1.lng },
                    destinations: { lat: location2.lat, lng: location2.lng }
                }, (err, response) => {
                    if (err) {
                        console.error(err);
                    }
                    const distance = new distance_1.default({
                        distance: response.json.rows[0].elements[0].distance.value,
                        duration: response.json.rows[0].elements[0].duration.value
                    });
                    return resolve(distance);
                });
            });
        });
    }
    getGoogleDistances(origins, destinations) {
        return __awaiter(this, void 0, void 0, function* () {
            const distances = {};
            const locationsOrigins = [];
            origins.forEach(origin => {
                locationsOrigins.push(origin.location);
            });
            const locationsDestinations = [];
            destinations.forEach(destination => {
                locationsDestinations.push(destination.location);
            });
            return yield new Promise((resolve, reject) => {
                this.googleMapsClient.distanceMatrix({
                    origins: locationsOrigins,
                    destinations: locationsDestinations
                }, (err, response) => {
                    if (err) {
                        console.error(err);
                    }
                    for (let r = 0; r < response.json.rows.length; r++) {
                        distances[origins[r].id] = {};
                        for (let e = 0; e < response.json.rows[r].elements.length; e++) {
                            distances[origins[r].id][destinations[e].id] = new distance_1.default({
                                distance: response.json.rows[r].elements[e].distance.value,
                                duration: response.json.rows[r].elements[e].duration.value
                            });
                        }
                    }
                    return resolve(distances);
                });
            });
        });
    }
    getGoogleDirection(origin, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                this.googleMapsClient.directions({
                    origin: origin,
                    destination: destination
                }, (err, response) => {
                    if (err) {
                        console.error(err);
                    }
                    const direction = {
                        distance: response.json.routes[0].distance.value,
                        duration: response.json.routes[0].duration.value,
                        polyline: this.decodePolyline(response.json.routes[0].overview_polyline.points)
                    };
                    return resolve(direction);
                });
            });
        });
    }
    isTimeUp() {
        return new Date().getTime() - this.startTime < this.algorithmMaxTime;
    }
    logPath(path) {
        let pathEdges = '';
        pathEdges += path.edges[0].startNode.id;
        path.edges.forEach((edge) => {
            pathEdges += ' -' + '-> ' + edge.endNode.id;
        });
        console.log(pathEdges, path.weight);
    }
    logEdges(edges) {
        let pathEdges = '';
        pathEdges += edges[0].startNode.id;
        edges.forEach((edge) => {
            pathEdges += ' -' + '-> ' + edge.endNode.id;
        });
        console.log(pathEdges);
    }
    isSuperArray(array1, array2) {
        const array1Copy = Object.assign([], array1);
        if (array2.length > array1Copy.length) {
            return false;
        }
        else {
            for (let i = 0; i < array2.length; i++) {
                const index = array1Copy.indexOf(array2[i]);
                if (index === -1) {
                    return false;
                }
                else {
                    array1Copy.splice(index, 1);
                }
            }
            return true;
        }
    }
    decodePolyline(encoded) {
        const points = [];
        let index = 0;
        let lat = 0, lng = 0;
        while (index < encoded.length) {
            var b, shift = 0, result = 0;
            do {
                b = encoded.charAt(index++).charCodeAt(0) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++).charCodeAt(0) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) });
        }
        return points;
    }
}
exports.Algorithm = Algorithm;
//# sourceMappingURL=algorithm.js.map
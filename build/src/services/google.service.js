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
class Google {
    constructor(clients, drivers, nodes) {
        this.clients = clients;
        this.drivers = drivers;
        this.nodes = nodes;
        this.initGoogleApi();
    }
    initGoogleApi() {
        this.googleMapsClient = gapi.createClient({
            key: 'AIzaSyB0hSN1QhrjZ4Qzdu1YH3E_RvBINVCrt_A'
        });
    }
    getDistances() {
        return __awaiter(this, void 0, void 0, function* () {
            this.distances = {};
            const promises = new Array();
            if (this.clients) {
                this.clients.forEach((client1) => {
                    promises.push(this.getGoogleDistance(client1.startLocation, client1.endLocation).then(distance => {
                        this.distances[client1.id][client1.id] = distance;
                    }));
                    this.clients.forEach((client2) => {
                        if (client1.id !== client2.id) {
                            if (!this.distances[client1.id]) {
                                this.distances[client1.id] = {};
                            }
                            promises.push(this.getGoogleDistance(client1.endLocation, client2.startLocation).then(distance => {
                                this.distances[client1.id][client2.id] = distance;
                            }));
                        }
                    });
                });
            }
            if (this.nodes) {
                for (var key in this.nodes) {
                    if (this.nodes.hasOwnProperty(key)) {
                        const driverNodes = this.nodes[key];
                        driverNodes.forEach(node => {
                            if (!this.distances[node.driver.id]) {
                                this.distances[node.driver.id] = {};
                            }
                            promises.push(this.getGoogleDistance(node.driver.location, node.client.startLocation).then(distance => {
                                this.distances[node.driver.id][node.client.id] = distance;
                            }));
                        });
                    }
                }
            }
            return new Promise((resolve, reject) => {
                Promise.all(promises).then(() => {
                    return resolve(this.distances);
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
}
exports.Google = Google;
//# sourceMappingURL=google.service.js.map
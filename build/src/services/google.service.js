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
// Models
const distance_1 = require("./../models/distance");
const latlng_1 = require("./../models/latlng");
class GoogleService {
    constructor() {
        this.initGoogleApi();
    }
    initGoogleApi() {
        this.googleMapsClient = gapi.createClient({
            // key: 'AIzaSyAPWbCNIq7JkMMH15K2H8EDzSCZwUD2JNI'
            key: 'AIzaSyB0hSN1QhrjZ4Qzdu1YH3E_RvBINVCrt_A'
            // key: 'AIzaSyBXTZogSxhfwrK_smDpOTFUBsWyoKW9ejU'
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
    getGoogleDirection(origin, destination, time) {
        return new Promise((resolve, reject) => {
            this.googleMapsClient.directions({
                origin: origin,
                destination: destination,
                departure_time: time
            }, (err, response) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                const direction = {
                    distance: response.json.routes[0].legs[0].distance.value,
                    duration: response.json.routes[0].legs[0].duration.value,
                    polyline: this.decodePolyline(response.json.routes[0].overview_polyline.points)
                };
                resolve(direction);
            });
        });
    }
    decodePolyline(encoded) {
        const points = new Array();
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
            points.push(new latlng_1.default({ lat: (lat / 1E5), lng: (lng / 1E5) }));
        }
        return points;
    }
}
exports.GoogleService = GoogleService;
exports.googleService = new GoogleService();
//# sourceMappingURL=google.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const latlng_1 = require("./latlng");
class Client {
    constructor(client) {
        this.id = client.id;
        this.params = client.params;
        this.startLocation = new latlng_1.default(client.startLocation);
        this.endLocation = new latlng_1.default(client.endLocation);
    }
}
exports.default = Client;
//# sourceMappingURL=client.1.js.map
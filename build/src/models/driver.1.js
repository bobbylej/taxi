"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const latlng_1 = require("./latlng");
class Driver {
    constructor(client) {
        this.id = client.id;
        this.params = client.params;
        this.location = new latlng_1.default(client.location);
    }
}
exports.default = Driver;
//# sourceMappingURL=driver.1.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const latlng_1 = require("./latlng");
class Driver {
    constructor(driver) {
        this.id = driver.id;
        this.params = driver.params;
        this.location = new latlng_1.default(driver.location);
        this.duration = driver.duration || 0;
    }
}
exports.default = Driver;
//# sourceMappingURL=driver.js.map
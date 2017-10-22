"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clients = require('../public/clients.json');
class FileService {
    constructor() { }
    readInput(filename) {
        return require('../public/' + filename);
    }
}
exports.FileService = FileService;
//# sourceMappingURL=file.service.js.map
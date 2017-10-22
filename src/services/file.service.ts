import * as fs from 'fs';
const clients = require('../public/clients.json');

export class FileService {
  constructor() {}

  readInput(filename) {
    return require('../public/' + filename);
  }
}

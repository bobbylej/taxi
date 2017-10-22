import Client from './client';
import Driver from './driver';

export default class Node {
  driver: Driver;
  client: Client;

  constructor(node: any) {
    if (node.driver) {
      this.driver = new Driver(node.driver);
    }
    if (node.client) {
      this.client = new Client(node.client);
    }
  }

  get id(): string {
    let id = '';
    if (this.driver) {
      id += this.driver.id;
    }
    id += '-';
    if (this.client) {
      id += this.client.id;
    }
    return id;
  }

  isEqual(node: Node): boolean {
    return this.driver.id === node.driver.id && this.client.id === node.client.id;
  }
}

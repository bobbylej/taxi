import Client from './client';
import Driver from './driver';

export default class Node {
  driver: Driver;
  client: Client;

  constructor(node?: any) {
    this.driver = node && node.driver ? new Driver(node.driver) : undefined;
    this.client = node && node.client ? new Client(node.client) : undefined;
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

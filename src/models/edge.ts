import Node from './node';
import Path from './path';

export default class Edge {
  weight: number;
  startNode: Node;
  endNode: Node;

  constructor(edge: any) {
    this.weight = edge.weight;
    this.startNode = new Node(edge.startNode);
    this.endNode = new Node(edge.endNode);
  }

  countEdge(path: Path, distances): number {
    if (!path) {
      console.error('(Edge.ts) countEdge: path is undefined');
      return;
    }
    const startDriver = this.startNode.driver;
    const endDriver = this.endNode.driver;
    const endDriverPath = path.driversPaths[endDriver.id];
    if (!endDriverPath || !endDriverPath.length) {
      return this.getDistance(endDriver, this.endNode.client, distances);
    } else if (startDriver.id === endDriver.id) {
      const startClient = this.startNode.client;
      const endClient = this.endNode.client;
      return this.getDistance(startClient, startClient, distances)
        + this.getDistance(startClient, endClient, distances);
    } else {
      const lastClient = endDriverPath[endDriverPath.length - 1];
      const endClient = this.endNode.client;
      return this.getDistance(lastClient, lastClient, distances)
        + this.getDistance(lastClient, endClient, distances);
    }
  }

  getDistance(object1, object2, distances) {
    return distances[object1.id][object2.id].duration;
  }
}

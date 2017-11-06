import { loginUserModel } from './../users/user-validator';
import Edge from './edge';
import Client from './client';

export default class Path {
  weight: number;
  edges: Array<Edge>;
  driversPaths: any;

  constructor(path: any) {
    this.weight = path.weight;
    this.edges = path.edges || [];
    this.driversPaths = path.driversPaths || {};
  }

  countPath() {
    let pathWeight = 0;
    this.edges.forEach(edge => {
      if (edge.weight === undefined) {
        console.error('(Path.ts) countPath: edge.weight is undefined');
        return;
      }
      pathWeight += edge.weight;
    });
    return pathWeight;
  }

  addEdgeToPath(edge: Edge): void {
    const endDriver = edge.endNode.driver;
    let endDriverPath = this.driversPaths[endDriver.id];
    const endClient = edge.endNode.client;
    if (!endDriverPath) {
      this.driversPaths[endDriver.id] = new Array<Client>();
    }
    this.driversPaths[endDriver.id].push(endClient);
    this.edges.push(edge);
  }

  clone(): Path {
    const edges = this.edges.map(edge => new Edge(edge));
    const driversPaths = {};
    for (let key in this.driversPaths) {
      if (this.driversPaths.hasOwnProperty(key)) {
        driversPaths[key] = this.driversPaths[key].slice(0);
      }
    }
    return new Path({
      edges,
      driversPaths
    });
  }

  toString(): string {
    let pathEdges = '';
    pathEdges += this.edges[0].startNode.id;
    this.edges.forEach((edge: Edge) => {
      pathEdges += ' -' + '-> ' + edge.endNode.id;
    });
    return pathEdges;
  }
}

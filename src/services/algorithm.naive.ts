import * as gapi from '@google/maps';
// Models
import Client from './../models/client';
import Driver from './../models/driver';
import Distance from './../models/distance';
import Edge from './../models/edge';
import Node from './../models/node';
import Path from './../models/path';
// Services
import { Algorithm } from './algorithm';

export class AlgorithmNaive extends Algorithm {
  iterations = 0;

  constructor(clients: Array<Client>, drivers: Array<Driver>, distances?: Array<Distance>) {
    super(clients, drivers, distances);
  }

  async findBestPath(getDistances?: boolean, getAllDistances?: boolean,): Promise<Path> {
    if (!this.distances || getDistances) {
      this.distances = Object.assign(this.distances, await this.getDistances(getAllDistances));
    }
    this.iterations = 0;
    this.startTime = new Date().getTime();
    let path = new Path({});
    this.findPaths(this.nodes);
    this.algorithmTime = new Date().getTime() - this.startTime;
    console.log('Naive - iterations', this.iterations, Object.keys(this.nodes).length);
    console.log(this.bestPath.toString());
    return this.bestPath;
  }

  findPaths(searchNodes: any, nodes?: Array<Node>, prevNode?: Node): void {
    let availableNodes = Object.assign({}, searchNodes);
    if (!nodes) {
      nodes = new Array<Node>();
    }
    if (prevNode) {
      delete availableNodes[prevNode.client.id];
    }
    for (let key in availableNodes) {
      if (availableNodes.hasOwnProperty(key)) {
        const clientNodes = availableNodes[key];
        clientNodes.forEach(node => {
          const nodesCopy = nodes.slice(0);
          nodesCopy.push(node);
          if (nodesCopy.length === Object.keys(this.nodes).length) {
            const path = this.createPath(nodesCopy);
            // if (path.toString().indexOf('d4-c1 --> d3-c5 --> d1-c4 --> d4-c3 --> d5-c2') !== -1) {
            //   console.log('OK', JSON.stringify(path));
            // }
            this.iterations++;
            if (!this.bestPath || this.bestPath.weight > path.weight) {
              this.bestPath = path;
              this.bestPathFindTime = new Date().getTime() - this.startTime;
            }
          } else {
            this.findPaths(availableNodes, nodesCopy, node);
          }
        });
      } else {
        return;
      }
    }
  }

  createPath(nodes: Array<Node>): Path {
    const path = new Path({});
    let prevNode = new Node({});
    nodes.forEach(node => {
      let edge = new Edge({
        startNode: prevNode,
        endNode: node
      });
      edge.weight = edge.countEdge(path, this.distances);
      path.addEdgeToPath(edge);
      prevNode = node;
    });
    path.weight = path.countPath();
    return path;
  }
}

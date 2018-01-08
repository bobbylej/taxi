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

export class AlgorithmBees extends Algorithm {
  initialExhaustedValue = 10;
  modifiesPathAmount = 3;
  beesAmount = 40;
  iterationAmount = 1100;
  exhaustedValues: Array<number>;
  paths: Array<Path>;

  constructor(clients: Array<Client>, drivers: Array<Driver>, distances?: Array<Distance>) {
    super(clients, drivers, distances);
  }

  async findBestPath(getDistances?: boolean, getAllDistances?: boolean,): Promise<Path> {
    if (!this.distances || getDistances) {
      this.distances = Object.assign(this.distances, await this.getDistances(getAllDistances));
    }
    this.startTime = new Date().getTime();
    this.initExhaustedValues();
    this.generateInitialPaths();
    // for (let i = 0; i < this.iterationAmount && this.isTimeUp(); i++) {
    for (let i = 0; !this.isTimeUp(); i++) {
      console.log('check0');
      this.explorePaths();
      console.log('check1');
      this.explorePathsWithProbability();
      console.log('check2');
      this.findNewPath();
      console.log('check3');
      this.getBestPath();
      console.log('check4');

    }
    this.algorithmTime = new Date().getTime() - this.startTime;
    console.log('Bees');
    console.log(this.bestPath.toString());
    return this.bestPath;
  }

  initExhaustedValues(): void {
    this.exhaustedValues = new Array<number>();
    for (let i = 0; i < this.beesAmount; i++) {
      this.exhaustedValues.push(this.initialExhaustedValue);
    }
  }

  generateInitialPaths(): void {
    this.paths = new Array<Path>();
    for (let i = 0; i < this.beesAmount; i++) {
      const path = this.findRandomPath();
      this.paths.push(path);
    }
  }

  explorePaths(): void {
    for (let i = 0; i < this.beesAmount; i++) {
      console.log('explorePaths', this.paths[i]);
      let path = this.modifyPath(this.paths[i]);
      console.log('explorePaths', path);

      path.weight = path.countPath();
      console.log('explorePaths', path.weight);
      if (this.paths[i].weight > path.weight) {
        this.paths[i] = path;
        this.exhaustedValues[i] = this.initialExhaustedValue;
      } else {
        this.exhaustedValues[i]--;
      }
    }
  }

  explorePathsWithProbability(): void {
    const newPaths = Object.assign([], this.paths);
    for (let i = 0; i < this.beesAmount; i++) {
      let path = this.modifyPath(this.findPath());
      path.weight = path.countPath();
      if (this.paths[i].weight > path.weight) {
        newPaths[i] = path;
        this.exhaustedValues[i] = this.initialExhaustedValue;
      } else {
        this.exhaustedValues[i]--;
      }
    }
    this.paths = newPaths;
  }

  findNewPath(): void {
    for (let i = 0; i < this.beesAmount; i++) {
      if (this.exhaustedValues[i] <= 0) {
        const path = this.findRandomPath();
        this.paths[i] = path;
        this.exhaustedValues[i] = this.initialExhaustedValue;
      }
    }
  }

  getBestPath(): Path {
    for (let i = 0; i < this.beesAmount; i++) {
      if (!this.bestPath || this.bestPath.weight > this.paths[i].weight) {
        this.bestPath = new Path(this.paths[i]);
        this.bestPathFindTime = new Date().getTime() - this.startTime;
      }
    }
    return this.bestPath;
  }

  findPath(): Path {
    let sumOfValues = 0;
    this.paths.forEach((path: Path) => {
      sumOfValues += path.weight;
    });
    let randomValue = Math.random() * sumOfValues;
    for (let i = 0; i < this.paths.length; i++) {
      randomValue -= this.paths[i].weight;
      if (randomValue <= 0) {
        return this.paths[i];
      }
    }
    return this.paths[this.paths.length - 1];
  }

  findRandomPath(): Path {
    const path = new Path({});
    let availableNodes = Object.assign({}, this.nodes);
    const nodesAmount = Object.keys(availableNodes).length;
    const startNode = new Node({});
    for (let n = 0; n < nodesAmount; n++) {
      let currentNode: Node;
      if (n === 0) {
        currentNode = startNode;
      } else {
        currentNode = path.edges[n - 1].endNode;
      }
      const edge = this.findNextEdge(path, currentNode, availableNodes);
      path.addEdgeToPath(edge);
      delete availableNodes[edge.endNode.client.id];
    }
    path.weight = path.countPath();
    return path;
  }

  findNextEdge(path: Path, currentNode: Node, nodes: Array<Array<Node>>): Edge {
    const nextNode = this.findRandomNode(nodes);
    let edge = new Edge({
      startNode: currentNode,
      endNode: nextNode
    });
    edge.weight = edge.countEdge(path, this.distances);
    return edge;
  }

  findRandomNode(nodes: Array<Array<Node>>): Node {
    const clients = Object.keys(nodes);
    const clientsAmount = clients.length;
    const clientId = clients[Math.floor(Math.random() * clientsAmount)];
    const drivers = nodes[clientId];
    const driversAmount = drivers.length;
    const driverId = Math.floor(Math.random() * driversAmount);
    return nodes[clientId][driverId];
  }

  modifyPath(path: Path): Path {
    if (path.edges.length > 1) {
      const edges = path.edges.map(edge => new Edge(edge));
      const edgesAmount = edges.length;
      for (let i = 0; i < this.modifiesPathAmount; i++) {
        const nodeIndex1 = this.getRandomIndexNodeFromPath(edges);
        let nodeIndex2 = this.getRandomIndexNodeFromPath(edges);
        while (nodeIndex1.node.isEqual(nodeIndex2.node)) {
          nodeIndex2 = this.getRandomIndexNodeFromPath(edges);
        }
        this.modifyNode(edges, nodeIndex1.index.edge, nodeIndex2.node);
        this.modifyNode(edges, nodeIndex2.index.edge, nodeIndex1.node);
        // this.replaceNode(edges, nodeIndex1.index.edge, nodeIndex2.node);
        // this.replaceNode(edges, nodeIndex2.index.edge, nodeIndex1.node);
      }
      const newPath = new Path({});
      edges.forEach(edge => {
        edge.weight = edge.countEdge(newPath, this.distances);
        newPath.addEdgeToPath(edge);
      });
      return newPath;
    }
    return path;
  }

  getRandomIndexNodeFromPath(edges: Array<Edge>): any {
    const edgesAmount = edges.length;
    const edgeIndex = Math.floor(Math.random() * edgesAmount);
    const nodeType = 'endNode';
    return {
      index: {
        edge: edgeIndex,
        node: nodeType
      },
      node: new Node(edges[edgeIndex][nodeType])
    };
  }

  replaceNode(edges: Array<Edge>, edgeIndex: any, node: Node): void {
    edges[edgeIndex].endNode = node;
    if (edgeIndex < edges.length - 1) {
      edges[edgeIndex + 1].startNode = node;
    }
  }

  modifyNode(edges: Array<Edge>, edgeIndex: any, node: Node): void {
    edges[edgeIndex].endNode.driver = node.driver;
    if (edgeIndex < edges.length - 1) {
      edges[edgeIndex + 1].startNode.driver = node.driver;
    }
  }
}

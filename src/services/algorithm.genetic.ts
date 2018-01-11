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

export class AlgorithmGenetic extends Algorithm {
  crossoverProbability = 0;
  mutationProbability = 0.6;
  gentypesAmount = 40;
  // iterationAmount = 100;
  paths: Array<Path>;

  constructor(clients: Array<Client>, drivers: Array<Driver>, distances?: Array<Distance>, params?: any) {
    super(clients, drivers, distances);
    if (params) {
      this.crossoverProbability = params.crossoverProbability;
      this.mutationProbability = params.mutationProbability;
      this.gentypesAmount = params.gentypesAmount;
    }
  }

  async findBestPath(getDistances?: boolean, getAllDistances?: boolean,): Promise<Path> {
    if (!this.distances || getDistances) {
      this.distances = Object.assign(this.distances, await this.getDistances(getAllDistances));
    }
    this.startTime = new Date().getTime();
    this.generateInitialPaths();
    // for (let i = 0; i < this.iterationAmount && this.isTimeUp(); i++) {
    for (let i = 0; !this.isTimeUp(); i++) {
      this.selectPaths();
      this.crossoverPaths();
      this.mutatePaths();
      this.getBestPath();
    }
    this.algorithmTime = new Date().getTime() - this.startTime;
    // console.log('Genetic');
    // console.log(this.bestPath.toString());
    return this.bestPath;
  }

  generateInitialPaths(): void {
    this.paths = new Array<Path>();
    for (let i = 0; i < this.gentypesAmount; i++) {
      const path = this.findRandomPath();
      this.paths.push(path);
    }
  }

  selectPaths(): void {
    const newPaths = new Array<Path>();
    const sumOfWeights = this.getSumOfWeights();
    for (let i = 0; i < this.paths.length; i++) {
      newPaths.push(this.selectPath(sumOfWeights));
    }
    this.paths = newPaths;
  }

  selectPath(sumOfWeights: number): Path {
    let randomValue = Math.random() * sumOfWeights;
    for (let i = 0; i < this.paths.length; i++) {
      randomValue -= this.paths[i].weight;
      if (randomValue <= 0) {
        return this.paths[i];
      }
    }
  }

  crossoverPaths(): void {
    const newPaths = new Array<Path>();
    for (let i = 0; i < this.gentypesAmount / 2; i++) {
      const genotype1 = this.getRandomPath();
      const genotype2 = this.getRandomPath();
      const probability = Math.random();
      if (probability < this.crossoverProbability) {
        const edges1 = genotype1.edges.map(edge => new Edge(edge));
        const edges2 = genotype2.edges.map(edge => new Edge(edge));
        const index = this.getRandomNodeIndexFromPath(genotype1);
        const halfIndex = genotype1.edges.length / 2;
        let startIndex, endIndex;
        if (index < halfIndex) {
          startIndex = 0;
          endIndex = index;
        } else {
          startIndex = index;
          endIndex = genotype1.edges.length;
        }
        for (let j = startIndex; j < endIndex; j++) {
          this.crossoverNode(edges1, genotype2.edges, j);
          this.crossoverNode(edges2, genotype1.edges, j);
        }
        const path1 = new Path({});
        edges1.forEach(edge => {
          edge.weight = edge.countEdge(path1, this.distances);
          path1.addEdgeToPath(edge);
        });
        path1.weight = path1.countPath();
        newPaths.push(path1);
        const path2 = new Path({});
        edges2.forEach(edge => {
          edge.weight = edge.countEdge(path2, this.distances);
          path2.addEdgeToPath(edge);
        });
        path2.weight = path2.countPath();
        newPaths.push(path2);
      } else {
        newPaths.push(genotype1);
        newPaths.push(genotype2);
      }
    }
    this.paths = newPaths;
  }

  crossoverNode(edges, newEdges, index): void {
    let oldNode = edges[index].endNode;
    let newNode = newEdges[index].endNode;
    let similarNodeIndex = this.getNodeIndexWithClient(edges, newNode.client);
    this.replaceNode(edges, index, newNode);
    if (index !== similarNodeIndex) {
      this.replaceNode(edges, similarNodeIndex, oldNode);
    }
  }

  mutatePaths(): void {
    const newPaths = new Array<Path>();
    for (let i = 0; i < this.gentypesAmount; i++) {
        newPaths.push(this.mutatePath(this.paths[i]));
    }
    this.paths = newPaths;
  }

  mutatePath(path: Path): Path {
    const edges = path.edges.map(edge => new Edge(edge));
    for (let i = 0; i < edges.length; i++) {
      const probability = Math.random();
      if (probability < this.mutationProbability) {
        const newNode = this.mutateNode(edges[i].endNode);
        this.replaceNode(edges, i, newNode);
      }
    }
    const newPath = new Path({});
    edges.forEach(edge => {
      edge.weight = edge.countEdge(newPath, this.distances);
      newPath.addEdgeToPath(edge);
    });
    newPath.weight = newPath.countPath();
    return newPath;
  }

  mutateNode(node: Node): Node {
    let driver = this.getRandomDriver();
    while (!this.canDriverGetClient(node.client, driver)) {
      driver = this.getRandomDriver();
    }
    node.driver = driver;
    return node;
  }

  getBestPath(): Path {
    for (let i = 0; i < this.gentypesAmount; i++) {
      if (!this.bestPath || this.bestPath.weight > this.paths[i].weight) {
        this.bestPath = new Path(this.paths[i]);
        this.bestPathFindTime = new Date().getTime() - this.startTime;
      }
    }
    return this.bestPath;
  }

  getRandomDriver(): Driver {
    return this.drivers[Math.floor(Math.random() * this.drivers.length)];
  }

  getRandomPath(): Path {
    return this.paths[Math.floor(Math.random() * this.paths.length)];
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

  getSumOfWeights(): number {
    let sumOfWeights = 0;
    this.paths.forEach(path => {
      sumOfWeights += path.weight;
    });
    return sumOfWeights;
  }

  getNodeIndexWithClient(edges: Array<Edge>, client: Client): number {
    for (let i = 0; i < edges.length; i++) {
      if (edges[i].endNode.client.id === client.id) {
        return i;
      }
    }
  }

  getRandomNodeIndexFromPath(path: Path): number {
    const edgesAmount = path.edges.length;
    const edgeIndex = Math.floor(Math.random() * (edgesAmount - 2) + 1);
    return edgeIndex;
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

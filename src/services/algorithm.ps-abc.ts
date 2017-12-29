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
import { SPVService } from './spv.service';

export class AlgorithmPSABC extends Algorithm {
  initialExhaustedValue = 10;
  modifiesPathAmount = 3;
  beesAmount = 40;
  iterationAmount = 1100;
  exhaustedValues: Array<number>;
  paths: Array<Path>;
  initialPaths: Array<Path>;
  spvService = new SPVService();
  N = 2;

  constructor(clients, drivers, distances?) {
    super(clients, drivers, distances);
  }

  async findBestPath(): Promise<Path> {
    if (!this.distances) {
      this.distances = await this.getDistances();
    }
    this.startTime = new Date().getTime();
    this.initExhaustedValues();
    this.generateInitialPaths();
    this.getBestPath();
    // for (let i = 0; i < this.iterationAmount && this.isTimeUp(); i++) {
    for (let i = 0; this.isTimeUp(); i++) {
      this.explorePaths();
      this.explorePathsWithProbability();
      this.findNewPath();
      this.getBestPath();
    }
    this.algorithmTime = new Date().getTime() - this.startTime;
    console.log('PS-ABC');
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
    this.initialPaths = this.paths.slice();
  }

  explorePaths(): void {
    for (let i = 0; i < this.beesAmount; i++) {
      let path = this.generateNeighborPath(this.paths[i], this.initialPaths[i], false);
      path.weight = path.countPath();
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
      const selectedPath = this.findPath();
      const initialPath = this.initialPaths[this.paths.indexOf(selectedPath)];
      let path = this.generateNeighborPath(selectedPath, initialPath, true);
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

  getBestPathFromArray(paths: Array<Path>): Path {
    let bestPath: Path;
    for (const path of paths) {
      if (!path.weight) {
        path.weight = path.countPath();
      }
      if (!bestPath || path.weight < bestPath.weight) {
        bestPath = path;
      }
    }
    return bestPath;
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

  // modifyPath(path: Path): Path {
  //   if (path.edges.length > 1) {
  //     const edges = path.edges.map(edge => new Edge(edge));
  //     const edgesAmount = edges.length;
  //     for (let i = 0; i < this.modifiesPathAmount; i++) {
  //       const nodeIndex1 = this.getRandomIndexNodeFromPath(edges);
  //       let nodeIndex2 = this.getRandomIndexNodeFromPath(edges);
  //       while (nodeIndex1.node.isEqual(nodeIndex2.node)) {
  //         nodeIndex2 = this.getRandomIndexNodeFromPath(edges);
  //       }
  //       this.modifyNode(edges, nodeIndex1.index.edge, nodeIndex2.node);
  //       this.modifyNode(edges, nodeIndex2.index.edge, nodeIndex1.node);
  //       // this.replaceNode(edges, nodeIndex1.index.edge, nodeIndex2.node);
  //       // this.replaceNode(edges, nodeIndex2.index.edge, nodeIndex1.node);
  //     }
  //     const newPath = new Path({});
  //     edges.forEach(edge => {
  //       edge.weight = edge.countEdge(newPath, this.distances);
  //       newPath.addEdgeToPath(edge);
  //     });
  //     return newPath;
  //   }
  //   return path;
  // }

  generateNeighborPath(path: Path, initialPath: Path, isOnlookerBee: boolean): Path {
    const randomPath = this.getRandomPath(path);
    if (randomPath) {
      const clientsVector = this.getNodesIndexVector(path, this.getClientIndex, this.clients);
      const clientsRandomVector = this.getNodesIndexVector(randomPath, this.getClientIndex, this.clients);
      const clientsBestVector = this.getNodesIndexVector(this.bestPath, this.getClientIndex, this.clients);
      const weights = {
        path: path.weight,
        initialPath: initialPath.weight
      };
      let neighborsClientsVectors = [];
      neighborsClientsVectors.push(this.generateNeighborVectorABC(clientsVector, clientsRandomVector));
      neighborsClientsVectors.push(this.generateNeighborVectorGABC(clientsVector, clientsRandomVector, clientsBestVector));
      neighborsClientsVectors.push(this.generateNeighborVectorIABC(clientsVector, clientsRandomVector, clientsBestVector, weights, isOnlookerBee));
      neighborsClientsVectors = neighborsClientsVectors.map(vector => this.spvService.spv(vector));

      const driversVector = this.getNodesIndexVector(path, this.getDriverIndex, this.drivers);
      const driversRandomVector = this.getNodesIndexVector(randomPath, this.getDriverIndex, this.drivers);
      const driversBestVector = this.getNodesIndexVector(this.bestPath, this.getDriverIndex, this.drivers);
      const driversInitialVector = this.getNodesIndexVector(initialPath, this.getClientIndex, this.clients);
      let neighborsDriversVectors = [];
      const limits = [], domains = [];
      for (const neighborClientsVector of neighborsClientsVectors) {
        const domain = this.generateDomainForVector(neighborClientsVector);
        domains.push(domain);
        const driverLimits = [];
        domain.forEach(drivers => {
          driverLimits.push({min: 0, max: drivers.length - 1})
        });
        limits.push(driverLimits);
      }
      neighborsDriversVectors.push(this.generateNeighborVectorABC(driversVector, driversRandomVector, limits[0]));
      neighborsDriversVectors.push(this.generateNeighborVectorGABC(driversVector, driversRandomVector, driversBestVector, limits[1]));
      neighborsDriversVectors.push(this.generateNeighborVectorIABC(driversVector, driversRandomVector, driversBestVector, weights, isOnlookerBee, limits[1]));
      neighborsDriversVectors = neighborsDriversVectors.map(vector => this.spvService.gspv(vector));

      const paths = [];
      neighborsClientsVectors.forEach((neighborClientsVectors, index) => {
        paths.push(this.convertVectorsToPath(neighborClientsVectors, neighborsDriversVectors[index], domains[index]));
      });
      return this.getBestPathFromArray(paths);
    } else {
      throw new Error('PSABC: generateNeighborPath: Cannot get neighbor path: Not enough paths')
    }
  }

  generateNeighborVectorABC(vector: Array<number>, compareVector: Array<number>, limits?: Array<{max: number, min: number}>): Array<number> {
    if (vector.length !== compareVector.length || limits && vector.length !== limits.length) {
      throw new Error('PSABC: generateNeighborPathABC: wrong vectors');
    }
    const neighborVector = [];
    vector.forEach((value, index) => {
      const phi = Math.random() * 2 - 1;
      let newValue = value + phi * (value - compareVector[index]);
      if (limits) {
        if (limits[index].min !== undefined) {
          if (newValue < limits[index].min && newValue >= 0) {
            newValue = limits[index].min;
          } else if (newValue > -1 * limits[index].min && newValue < 0) {
            newValue = -1 * limits[index].min;
          }
        }
        if (limits[index].max !== undefined) {
          if (newValue > limits[index].max) {
            newValue = limits[index].max;
          } else if (newValue < -1 * limits[index].max) {
            newValue = -1 * limits[index].max;
          }
        }
      }
      neighborVector.push(newValue);
    });
    return neighborVector;
  }

  generateNeighborVectorGABC(vector: Array<number>, compareVector: Array<number>, bestVector: Array<number>, limits?: Array<{max: number, min: number}>): Array<number> {
    if (vector.length !== compareVector.length || limits && vector.length !== limits.length) {
      throw new Error('PSABC: generateNeighborVectorGABC: wrong vectors');
    }
    const neighborVector = [];
    vector.forEach((value, index) => {
      const phi = Math.random() * 2 - 1;
      const psi = Math.random() * this.N;
      let newValue = value + phi * (value - compareVector[index]) + psi * (bestVector[index] - value);
      if (limits) {
        if (limits[index].min !== undefined) {
          if (newValue < limits[index].min && newValue >= 0) {
            newValue = limits[index].min;
          } else if (newValue > -1 * limits[index].min && newValue < 0) {
            newValue = -1 * limits[index].min;
          }
        }
        if (limits[index].max !== undefined) {
          if (newValue > limits[index].max) {
            newValue = limits[index].max;
          } else if (newValue < -1 * limits[index].max) {
            newValue = -1 * limits[index].max;
          }
        }
      }
      neighborVector.push(newValue);
    });
    return neighborVector;
  }

  generateNeighborVectorIABC(
    vector: Array<number>,
    compareVector: Array<number>,
    bestVector: Array<number>,
    weights: {path: number, initialPath: number},
    isOnlookerBee: boolean,
    limits?: Array<{max: number, min: number}>
  ): Array<number> {
    if (vector.length !== compareVector.length || limits && vector.length !== limits.length) {
      throw new Error('PSABC: generateNeighborVectorIABC: wrong vectors');
    }
    const neighborVector = [];
    vector.forEach((value, index) => {
      const phi = Math.random() * 2 - 1;
      const psi = Math.random() * this.N;
      const weight = 1 / (1 + Math.exp(-1 * weights.path / weights.initialPath));
      const phi1 = weight;
      const phi2 = isOnlookerBee ? weight : 1;
      let newValue = value * weight + phi * phi1 * (value - compareVector[index]) + psi * phi2 * (bestVector[index] - value);
      if (limits) {
        if (limits[index].min !== undefined) {
          if (newValue < limits[index].min && newValue >= 0) {
            newValue = limits[index].min;
          } else if (newValue > -1 * limits[index].min && newValue < 0) {
            newValue = -1 * limits[index].min;
          }
        }
        if (limits[index].max !== undefined) {
          if (newValue > limits[index].max) {
            newValue = limits[index].max;
          } else if (newValue < -1 * limits[index].max) {
            newValue = -1 * limits[index].max;
          }
        }
      }
      neighborVector.push(newValue);
    });
    return neighborVector;
  }

  convertVectorsToPath(clientsVector: Array<number>, driversVector: Array<number>, driversDomain: Array<Array<Driver>>): Path {
    const path = new Path({});
    clientsVector.forEach((clientIndex, index) => {
      let prevNode = new Node({});
      if (index !== 0) {
        const prevClient = this.clients[clientsVector[index-1]];
        const prevDriver = driversDomain[index-1][driversVector[index-1]];
        prevNode = new Node({client: prevClient, driver: prevDriver});
      }
      const client = this.clients[clientIndex];
      const driver = driversDomain[index][driversVector[index]];
      const node = new Node({client, driver});
      const edge = new Edge({
        startNode: prevNode,
        endNode: node
      });
      edge.weight = edge.countEdge(path, this.distances);
      path.addEdgeToPath(edge);
    });
    path.weight = path.countPath();
    return path;
  }

  generateDomainForVector(clientsVector: Array<number>): Array<Array<Driver>> {
    const limits = [];
    clientsVector.forEach(clientIndex => {
      const client = this.clients[clientIndex];
      const drivers = this.drivers.filter(driver => {
        return this.canDriverGetClient(client, driver);
      });
      limits.push(drivers);
    });
    return limits;
  }

  getNodesIndexVector(path: Path, getNodeIndex: Function, array: Array<any>): Array<number> {
    const vector = new Array<number>();
    path.edges.forEach((edge: Edge, index: number) => {
      const nodeIndex = getNodeIndex(edge.endNode, array);
      if (nodeIndex !== -1) {
        vector.push(nodeIndex);
      }
    });
    return vector;
  }

  getClientIndex(node: Node, clients: Array<Client>): number {
    return clients.findIndex(client => {
      return client.id === node.client.id;
    });
  }

  getDriverIndex(node: Node, drivers: Array<Driver>): number {
    return drivers.findIndex(driver => {
      return driver.id === node.driver.id;
    });
  }

  getRandomPath(path?: Path): Path {
    const paths = this.paths.slice();
    if (paths) {
      if (path) {
        const index = this.paths.indexOf(path);
        paths.splice(index, 1);
      }
      const randomIndex = Math.floor(Math.random() * paths.length);
      return paths[randomIndex];
    }
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

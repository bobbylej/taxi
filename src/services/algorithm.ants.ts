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

export class AlgorithmAnts extends Algorithm {
  pheromones: any;
  pheromonDecayCoefficient = 0.1; // pG
  pheromonLocalDecayCoefficient = 0.1; // pL
  betterEdgeCoefficient = 0.75; // q0
  importanceInformation = 1; // Beta
  antsAmount = 40;
  // iterationAmount = 300;
  // minIterationAmount = 1;

  constructor(clients: Array<Client>, drivers: Array<Driver>, distances?: Array<Distance>, params?: any) {
    super(clients, drivers, distances);
    if (params) {
      this.pheromonDecayCoefficient = params.pheromonDecayCoefficient;
      this.pheromonLocalDecayCoefficient = params.pheromonLocalDecayCoefficient;
      this.betterEdgeCoefficient = params.betterEdgeCoefficient;
      this.importanceInformation = params.importanceInformation;
      this.antsAmount = params.antsAmount;
    }
  }

  async findBestPath(getDistances?: boolean, getAllDistances?: boolean,): Promise<Path> {
    if (!this.distances || getDistances) {
      this.distances = Object.assign(this.distances, await this.getDistances(getAllDistances));
    }
    // this.startTime = new Date().getTime();
    this.initPheromones();
    // this.algorithmTime = new Date().getTime() - this.startTime;
    // console.log('Time init', this.algorithmTime);
    this.startTime = new Date().getTime();
    // for (let i = 0; i < this.iterationAmount && this.isTimeUp(); i++) {
    for (let i = 0; !this.isTimeUp(); i++) {
      for (let m = 0; m < this.antsAmount; m++) {
        this.runAnt();
      }
      this.globalUpdatePheromones();
    }
    this.algorithmTime = new Date().getTime() - this.startTime;
    // console.log('Ants');
    // console.log(this.bestPath.toString());
    return this.bestPath;
  }

  runAnt(): void {
    const path = this.findPath();
    if (!this.bestPath || this.bestPath.weight > path.weight) {
      this.bestPath = path;
      this.bestPathFindTime = new Date().getTime() - this.startTime;
    }
  }

  findPath(): Path {
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
      this.localUpdatePheromones(path, edge, availableNodes);
      delete availableNodes[edge.endNode.client.id];
    }
    path.weight = path.countPath();
    return path;
  }

  findPathByNearestNeighbour(path: Path, edge: Edge, nodes: any): Path {
    const wholePath = path.clone();
    let availableNodes = Object.assign({}, nodes);
    wholePath.addEdgeToPath(edge);
    delete availableNodes[edge.endNode.client.id];
    const nodesAmount = Object.keys(availableNodes).length;
    const startNode = edge.endNode;
    for (let n = 0; n < nodesAmount; n++) {
      let currentNode: Node;
      if (n === 0) {
        currentNode = startNode;
      } else {
        currentNode = wholePath.edges[n - 1].endNode;
      }
      const nextEdge = this.findNextNearestEdge(wholePath, currentNode, availableNodes);
      wholePath.addEdgeToPath(nextEdge);
      delete availableNodes[nextEdge.endNode.client.id];
    }
    wholePath.weight = wholePath.countPath();
    return wholePath;
  }

  findNextEdge(path: Path, currentNode: Node, nodes: Array<Array<Node>>): Edge {
    const edgesToChoose = this.generateEdgesToChoose(path, currentNode, nodes);
    const randomBetterEdgeCoefficient = Math.random();
    if (randomBetterEdgeCoefficient <= this.betterEdgeCoefficient) {
      return this.findBestEdge(edgesToChoose);
    } else {
      return this.findRandomEdge(edgesToChoose);
    }
  }

  findNextNearestEdge(path: Path, currentNode: Node, nodes: Array<Array<Node>>): Edge {
    const edgesToChoose = this.generateEdgesToChooseNearest(path, currentNode, nodes);
    return this.findNearestEdge(edgesToChoose);
  }

  findNearestEdge(edgesToChoose: Array<any>): Edge {
    let bestEdge;
    for (let key in edgesToChoose) {
      if (edgesToChoose.hasOwnProperty(key)) {
        let edge = edgesToChoose[key];
        if (!bestEdge || bestEdge.weight < edge.weight) {
          bestEdge = edge;
        }
      }
    }
    return bestEdge;
  }

  findBestEdge(edgesToChoose: Array<any>): Edge {
    let bestEdge = {
      edge: undefined,
      value: 0
    };
    for (let key in edgesToChoose) {
      if (edgesToChoose.hasOwnProperty(key)) {
        let edge = edgesToChoose[key];
        if (bestEdge.value < edge.value) {
          bestEdge = edge;
        }
      }
    }
    return bestEdge.edge;
  }

  findRandomEdge(edgesToChoose: Array<any>): Edge {
    let sumOfValues = 0;
    edgesToChoose.forEach(edge => {
      sumOfValues += edge.value;
    });
    let randomValue = Math.random() * sumOfValues;
    for (let key in edgesToChoose) {
      if (edgesToChoose.hasOwnProperty(key)) {
        randomValue -= edgesToChoose[key].value;
        if (randomValue <= 0) {
          return edgesToChoose[key].edge;
        }
      }
    }
    return edgesToChoose[edgesToChoose.length - 1].edge;
  }

  generateEdgesToChoose(path: Path, currentNode: Node, nodes: Array<Array<Node>>): Array<any> {
    const edgesToChoose = new Array<any>();
    for (let key in nodes) {
      if (nodes.hasOwnProperty(key)) {
        const clientNodes = nodes[key];
        clientNodes.forEach(node => {
          let edge = new Edge({
            startNode: currentNode,
            endNode: node
          });
          edge.weight = edge.countEdge(path, this.distances);
          let value = this.pheromones[currentNode.id][node.id] * Math.pow(1 / edge.weight, this.importanceInformation);
          edgesToChoose.push({edge, value});
        });
      }
    }
    return edgesToChoose;
  }

  generateEdgesToChooseNearest(path: Path, currentNode: Node, nodes: Array<Array<Node>>): Array<any> {
    const edgesToChoose = new Array<any>();
    for (let key in nodes) {
      if (nodes.hasOwnProperty(key)) {
        const clientNodes = nodes[key];
        clientNodes.forEach(node => {
          let edge = new Edge({
            startNode: currentNode,
            endNode: node
          });
          edge.weight = edge.countEdge(path, this.distances);
          edgesToChoose.push(edge);
        });
      }
    }
    return edgesToChoose;
  }

  initPheromones(): any {
    this.pheromones = {};
    if (this.nodes) {
      const startNode = new Node();
      this.pheromones[startNode.id] = {};
      for (var key1 in this.nodes) {
        if (this.nodes.hasOwnProperty(key1)) {
          const clientNodes1 = this.nodes[key1];
          clientNodes1.forEach(node1 => {
            const path = new Path();
            const edge = new Edge({
              startNode,
              endNode: new Node({
                driver: node1.driver,
                client: node1.client
              })
            });
            edge.weight = edge.countEdge(path, this.distances);
            const availableNodes = Object.assign({}, this.nodes);
            delete availableNodes[node1.client.id];
            this.pheromones[startNode.id][node1.id] = 0.0001; //this.getInitPheromone(path, edge, availableNodes);

            if (!this.pheromones[node1.id]) {
              this.pheromones[node1.id] = {};
            }
            for (var key2 in this.nodes) {
              if (this.nodes.hasOwnProperty(key2) && key1 !== key2) {
                const clientNodes2 = this.nodes[key2];
                clientNodes2.forEach(node2 => {
                  const path = new Path();
                  const startEdge = new Edge({
                    startNode,
                    endNode: new Node({
                      driver: node1.driver,
                      client: node1.client
                    })
                  });
                  startEdge.weight = startEdge.countEdge(path, this.distances);
                  path.addEdgeToPath(startEdge);
                  const edge = new Edge({
                    startNode: node1,
                    endNode: new Node({
                      driver: node2.driver,
                      client: node2.client
                    })
                  });
                  edge.weight = edge.countEdge(path, this.distances);
                  const availableNodes = Object.assign({}, this.nodes);
                  delete availableNodes[node1.client.id];
                  delete availableNodes[node2.client.id];
                  this.pheromones[node1.id][node2.id] = 0.0001; //this.getInitPheromone(path, edge, availableNodes);
                });
              }
            }
          });
        }
      }
    }
    return this.pheromones;
  }

  globalUpdatePheromones(): void {
    this.bestPath.edges.forEach((edge: Edge) => {
      const pheromone = this.pheromones[edge.startNode.id][edge.endNode.id];
      this.pheromones[edge.startNode.id][edge.endNode.id] = this.getGlobalUpdatedPheromone(pheromone);
    });
  }

  getGlobalUpdatedPheromone(pheromone: number): number {
    return (1 - this.pheromonDecayCoefficient) * pheromone + this.pheromonDecayCoefficient * (1 / this.bestPath.weight);
  }

  localUpdatePheromones(path: Path, edge: Edge, nodes: any): void {
    this.pheromones[edge.startNode.id][edge.endNode.id] = this.getLocalUpdatedPheromone(path, edge, nodes);
  }

  getLocalUpdatedPheromone(path: Path, edge: Edge, nodes: any): number {
    const availableNodes = Object.assign({}, nodes);
    delete availableNodes[edge.endNode.client.id];
    const nodesAmount = Object.keys(availableNodes).length;
    let nearestEdgeWeight = 0;
    if (nodesAmount > 0) {
      nearestEdgeWeight = this.findNextNearestEdge(path, edge.endNode, availableNodes).weight;
    }
    const pheromonInitialValue = 1 / (nearestEdgeWeight * nodesAmount + path.countPath());
    const pheromone = this.pheromones[edge.startNode.id][edge.endNode.id];
    return (1 - this.pheromonLocalDecayCoefficient) * pheromone + this.pheromonLocalDecayCoefficient * pheromonInitialValue;
  }

  getInitPheromone(path: Path, edge: Edge, nodes: any): number {
    let pheromonInitialValue = 1 / edge.weight;
    if (Object.keys(nodes).length > 0) {
      const nearestEdge = this.findNextNearestEdge(path, edge.endNode, nodes);
      pheromonInitialValue = 1 / (nearestEdge.weight * Object.keys(this.nodes).length);
    }
    return this.pheromonDecayCoefficient * pheromonInitialValue;
  }
}

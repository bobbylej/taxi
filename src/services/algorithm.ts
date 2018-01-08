import * as gapi from '@google/maps';
// Models
import Client from './../models/client';
import Driver from './../models/driver';
import Distance from './../models/distance';
import Edge from './../models/edge';
import LatLng from './../models/latlng';
import Node from './../models/node';
import Path from './../models/path';
// Services
import { googleService } from './google.service';
import { helperService } from './helper.service';

export class Algorithm {
  distances: Array<Distance>;
  nodes: Array<Array<Node>>;
  clients: Array<Client>;
  drivers: Array<Driver>;

  algorithmMaxTime = 1000;
  startTime: number;
  algorithmTime: number;
  bestPathFindTime: number;
  bestPath: Path;

  hasClientTimeLimit = false;
  clientMaxWaitingTime = 20 * 60; // 20min

  constructor(clients: Array<Client>, drivers: Array<Driver>, distances?: Array<Distance>) {
    this.clients = clients;
    this.drivers = drivers;
    this.nodes = this.generateNodes();
    this.distances = distances;
  }

  findPath(): Path {
    const path = new Path({});
    let availableNodes = Object.assign({}, this.nodes);
    const nodesAmount = Object.keys(availableNodes).length;
    const startNode = this.findStartNode();
    for (let n = 0; n < nodesAmount; n++) {
      let prevNode: Node;
      if (n === 0) {
        prevNode = startNode;
      } else {
        prevNode = path.edges[n - 1].endNode;
      }
      const nextNode = this.findNextNode(availableNodes);
      const edge = new Edge({
        startNode: prevNode,
        endNode: nextNode
      });
      edge.weight = edge.countEdge(path, this.distances);
      path.addEdgeToPath(edge);
      delete availableNodes[nextNode.client.id];
    }
    path.weight = path.countPath();
    return path;
  }

  findNextNode(nodes: Array<Array<Node>>): Node {
    const clientsIds = Object.keys(nodes);
    const clientsNodes = nodes[clientsIds[Math.floor(clientsIds.length * Math.random())]];
    return clientsNodes[Math.floor(clientsNodes.length * Math.random())];
  }

  findStartNode(): Node {
    const driver = this.drivers[Math.floor(this.drivers.length * Math.random())];
    return new Node({ driver });
  }

  generateNodes(): any {
    const nodes = {};
    if (this.clients && this.drivers) {
      this.clients.forEach(client => {
        if (!nodes[client.id]) {
          nodes[client.id] = new Array<Node>();
        }
        this.drivers.forEach(driver => {
          if (this.canDriverGetClient(client, driver)) {
            nodes[client.id].push(new Node({ driver, client }));
          }
        });
      });
    }
    return nodes;
  }

  canDriverGetClient(client: Client, driver: Driver, driverPath?: Array<Client>): boolean {
    if (client.params && client.params.length) {
      if (!(driver.params && driver.params.length)) {
        return false;
      }
      if (!helperService.isSuperArray(driver.params, client.params)) {
        return false;
      }
      if (this.hasClientTimeLimit && driverPath && this.countTimeToGetClient(client, driver, driverPath) > 60 * 20) {
        return false;
      }
    }
    return true;
  }

  countTimeToGetClient(client: Client, driver: Driver, driverPath: Array<Client>): number {
    const path = new Path();
    if (driverPath) {
      driverPath.forEach((clientInPath: Client, index: number) => {
        let startNode = new Node();
        if (index > 0) {
          startNode = path.edges[index - 1].endNode;
        }
        const endNode = new Node({
          driver: driver,
          client: clientInPath
        });
        const edge = new Edge({startNode, endNode});
        edge.weight = edge.countEdge(path, this.distances);
        path.addEdgeToPath(edge);
      });
    }
    let prevNode = path.edges && path.edges.length ? path.edges[path.edges.length - 1].endNode : new Node();
    const edge = new Edge({
      startNode: prevNode,
      endNode: new Node({driver, client})
    });
    edge.weight = edge.countEdge(path, this.distances);
    path.addEdgeToPath(edge);
    path.weight = path.countPath();
    // Weight of path/edge is time of taxi's route
    return path.weight;
  }

  async getDistances(getAllDistances?: boolean): Promise<any> {
    // console.log('getDistances; clients: ', this.clients.length, 'taxi: ', this.drivers.length);
    const finalDistances = {};
    const promises = new Array<Promise<any>>();
    let promiseAmount = 0;
    if (getAllDistances && this.clients) {
      this.clients.forEach((client1: Client) => {
        let origins = [];
        let destinations = [];
        origins.push({
          id: client1.id,
          location: client1.startLocation
        });
        destinations.push({
          id: client1.id,
          location: client1.endLocation
        });
        promises.push(googleService.getDistances(origins, destinations).then(distances => {
          // tslint:disable-next-line:forin
          for (let key in distances) {
            if (!finalDistances[key]) {
              finalDistances[key] = {};
            }
            Object.assign(finalDistances[key], distances[key]);
          }
        }));

        origins = [];
        destinations = [];
        origins.push({
          id: client1.id,
          location: client1.endLocation
        });
        this.clients.forEach((client2: Client) => {
          if (client1.id !== client2.id) {
            destinations.push({
              id: client2.id,
              location: client2.startLocation
            });
          }
        });
        promises.push(googleService.getDistances(origins, destinations).then(distances => {
          // tslint:disable-next-line:forin
          for (let key in distances) {
            if (!finalDistances[key]) {
              finalDistances[key] = {};
            }
            Object.assign(finalDistances[key], distances[key]);
            // console.log('--------------------------------------------------------------------');
            // console.log(JSON.stringify(finalDistances));
          }
        }));
      });
    }
    if (this.drivers) {
      const destinations = [];
      this.drivers.forEach(driver => {
        const origins = [];
        origins.push({
          id: driver.id,
          location: driver.location
        });
        this.clients.forEach(client => {
          destinations.push({
            id: client.id,
            location: client.startLocation
          });
        });
        promises.push(googleService.getDistances(origins, destinations)
          .then(distances => {
            Object.assign(finalDistances, distances);
            // console.log('--------------------------------------------------------------------');
            // console.log(JSON.stringify(finalDistances));
          })
          .catch(error => {
            console.error('ERROR', error);
            throw error;
          }));
      });
    }

    return Promise.all(promises).then((values) => {
        return finalDistances;
      })
      .catch(error => {
        console.error('ERROR', error);
        throw error;
      });
  }

  isTimeUp(): boolean {
    return new Date().getTime() - this.startTime >= this.algorithmMaxTime;
  }
}

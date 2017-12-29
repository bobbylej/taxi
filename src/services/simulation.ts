import * as gapi from '@google/maps';
// Models
import Client from './../models/client';
import Driver from './../models/driver';
import Distance from './../models/distance';
import Edge from './../models/edge';
import LatLng from './../models/latlng';
import Node from './../models/node';
import Path from './../models/path';
import Route from './../models/route';
// Services
import { FileService } from './../services/file.service';
import { Algorithm } from './../services/algorithm';
import { AlgorithmAnts } from './../services/algorithm.ants';
import { AlgorithmAntsMy } from './../services/algorithm.ants.my';
import { AlgorithmBees } from './../services/algorithm.bees';
import { AlgorithmPSABC } from './../services/algorithm.ps-abc';
import { AlgorithmGenetic } from './../services/algorithm.genetic';
import { AlgorithmNaive } from './../services/algorithm.naive';
// Services
import { googleService } from './google.service';
import { helperService } from './helper.service';

export class Simulation {
  clients: Array<Client>;
  drivers: Array<Driver>;
  distances: Array<Distance>;

  constructor(clients: Array<Client>, drivers: Array<Driver>, distances?: Array<Distance>) {
    this.clients = clients;
    this.drivers = drivers;
    this.distances = distances;
  }

  async start(): Promise<number> {
    let waitingClients = new Array<Client>();
    let freeDrivers = this.drivers.slice(0);
    let driversRoutes = new Array<Route>();
    let globalTime = 0;
    let fullDuration = 0;

    console.log('clients: ', this.clients.length);
    for (const client of this.clients) {
      waitingClients.push(client);
      globalTime = client.time;
      fullDuration += this.countDuration(driversRoutes, globalTime);
      console.log('duration: ', fullDuration);
      waitingClients = this.getWaitingClients(waitingClients, driversRoutes, globalTime);
      console.log('waitingClients: ', waitingClients.length);
      freeDrivers = this.getFreeDrivers(driversRoutes, globalTime);
      console.log('freeDrivers: ', freeDrivers.length);
      const algorithm = new AlgorithmPSABC(waitingClients, freeDrivers);
      const pathAnts = await algorithm.findBestPath();
      driversRoutes = await this.getDriversRoutesFromPath(pathAnts);
    }
    fullDuration += this.countDuration(driversRoutes, -1);

    console.log('Full duration: ', fullDuration);
    return fullDuration;
  }

  async getDistances(clients: Array<Client>, drivers: Array<Driver>): Promise<any> {
    const algorithm = new Algorithm(clients, drivers);
    return await algorithm.getDistances();
  }

  countDuration(driversRoutes: any, time: number): number {
    let duration = 0;
    for (const driver of this.drivers) {
      if (driversRoutes[driver.id]) {
        for (const route of driversRoutes[driver.id]) {
          if (route.timeEnd <= time || time === -1) {
            duration += route.direction.duration;
          } else if (route.timeStart <= time && route.timeEnd > time) {
            const progress = (time - route.timeStart) / (route.timeEnd - route.timeStart);
            duration += route.direction.duration * progress;
          }
        }
      }
    }
    return duration;
  }

  getFreeDrivers(driversRoutes: Array<Route>, time: number): Array<Driver> {
    // const newDriversRoutes = {};
    const freeDrivers = new Array<Driver>();
    for (const driver of this.drivers) {
      let isFree = true;
      if (driversRoutes[driver.id]) {
        for (const route of driversRoutes[driver.id]) {
          if (route.timeEnd <= time) {
            driver.location = this.getDriverLocation(route.direction.polyline, 1);
          } else if (route.timeStart <= time && route.timeEnd > time) {
            isFree = isFree && route.hired;
            const progress = (time - route.timeStart) / (route.timeEnd - route.timeStart);
            driver.location = this.getDriverLocation(route.direction.polyline, progress);
          //   if (!newDriversRoutes[driver.id]) {
          //     newDriversRoutes[driver.id] = new Array();
          //   }
          //   newDriversRoutes[driver.id].push(route);
          // } else if (route.timeStart > time) {
          //   newDriversRoutes[driver.id].push(route);
          }
        }
      }
      if (isFree) {
        freeDrivers.push(driver);
      }
    }
    return freeDrivers;
  }

  getWaitingClients(waitingClients: Array<Client>, driversRoutes: any, time: number): Array<Client> {
    const newWaitingClients = new Array<Client>();
    // console.log(JSON.stringify(driversRoutes))
    for (const driver of this.drivers) {
      if (driversRoutes[driver.id]) {
        for (const route of driversRoutes[driver.id]) {
          if (route.timeEnd <= time) {
            let index = -1;
            for (let i = 0; i < waitingClients.length; i++) {
              if (waitingClients[i].id === route.client.id) {
                index = i;
              }
            }
            if (index !== -1) {
              waitingClients.splice(index, 1);
            }
          } else if (route.timeStart <= time && route.timeEnd > time) {
            if (!route.hired) {
              route.client.time = time;
              let index = helperService.findIndex(newWaitingClients, {id: route.client.id});
              if (index === -1) {
                newWaitingClients.push(route.client);
              }
            } else {
              let index = helperService.findIndex(waitingClients, {id: route.client.id});
              if (index !== -1) {
                waitingClients.splice(index, 1);
              }
            }
          } else if (route.timeStart > time) {
            let index = helperService.findIndex(newWaitingClients, {id: route.client.id});
            if (index === -1) {
              newWaitingClients.push(route.client);
            }
          }
        }
      }
    }
    for (const client of waitingClients) {
      let exists = false;
      for (const newClient of newWaitingClients) {
        if (client.id === newClient.id) {
          exists = true;
        }
      }
      if (!exists) {
        newWaitingClients.push(client);
      }
    }
    return newWaitingClients;
  }

  getDriverLocation(polyline: Array<LatLng>, progress: number): LatLng {
    const index = Math.round((polyline.length - 1) * progress);
    return polyline[index];
  }

  async getDriversRoutesFromPath(path: Path): Promise<any> {
    const driversRoutes = {};
    for (const [index, edge] of path.edges.entries()) {
      const driver = edge.endNode.driver;
      const client = edge.endNode.client;
      const clientIndex = path.driversPaths[driver.id].indexOf(client.id);
      const driverPath = path.driversPaths[driver.id].slice(0, clientIndex);
      let startTime = parseInt(client.time + '');
      if (!driversRoutes[driver.id]) {
        driversRoutes[driver.id] = new Array<Route>();
      } else if (driversRoutes[driver.id][driversRoutes[driver.id].length - 1].timeEnd > startTime) {
        startTime = driversRoutes[driver.id][driversRoutes[driver.id].length - 1].timeEnd;
      }
      let routeToClient;
      if (driverPath.length > 0) {
        const lastClient: Client = driverPath[driverPath.length - 1];
        routeToClient = await this.getDirection(lastClient.endLocation, client.startLocation, client.time);
      } else {
        routeToClient = await this.getDirection(driver.location, client.startLocation, client.time);
      }
      driversRoutes[driver.id].push(new Route({
        index: index,
        timeStart: startTime,
        timeEnd: startTime + routeToClient.duration,
        direction: routeToClient,
        hired: false,
        client: client
      }));
      const routeWithClient = await this.getDirection(client.startLocation, client.endLocation, client.time);
      driversRoutes[driver.id].push(new Route({
        index: index,
        timeStart: startTime + routeToClient.duration,
        timeEnd: startTime + routeToClient.duration + routeWithClient.duration,
        direction: routeWithClient,
        hired: true,
        client: client
      }));
    }
    return driversRoutes;
  }

  async getDirection(startLocation: LatLng, endLocation: LatLng, time: number): Promise<any> {
    const futureDate = new Date(time);
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    return await googleService.getGoogleDirection(startLocation, endLocation, futureDate.getTime());
  }
}

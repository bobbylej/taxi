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
    let driversRoutes = new Array<Array<Route>>();
    let globalTime = 0;
    let fullDuration = 0;
    this.distances = this.distances ? this.distances : await this.getDistances(this.clients, this.drivers);
    this.clients.sort((client1, client2) => {
      return client1.time - client2.time;
    });
    let index = 0;
    let iteration = 0;

    // console.log('clients: ', this.clients.length, 'taxi: ', this.drivers.length);
    // for (let index = 0; index < this.clients.length; index++) {
    //   waitingClients.push(this.clients[index]);
    //   globalTime = this.clients[index].time;
    while (index < this.clients.length) {
      waitingClients.push(this.clients[index]);
      globalTime = parseInt(this.clients[index].time + '') + 2 * 60; // add 2min
      // console.log('index', index, waitingClients.length);
      // console.log('client time', this.clients[index].time, globalTime);
      index++;
      let nextClient = this.clients[index];
      while (index < this.clients.length && parseInt(nextClient.time + '') <= globalTime) {
        waitingClients.push(nextClient);
        index++;
        nextClient = this.clients[index];
      }
      // console.log('index2', index, waitingClients.length);

      fullDuration += this.countDuration(driversRoutes, globalTime);
      // console.log('duration: ', fullDuration);
      waitingClients = this.getWaitingClients(waitingClients, driversRoutes, globalTime);
      // const cIds = waitingClients.map(client => {
      //   return client.id;
      // });
      // console.log('---------------------------------cIds', cIds);
      // console.log('waitingClients: ', waitingClients.length);
      freeDrivers = this.getFreeDrivers(driversRoutes, globalTime);
      // console.log('freeDrivers: ', freeDrivers.length);
      const algorithm = new AlgorithmAnts(waitingClients, freeDrivers, this.distances);
      // console.log('start: ', 'findBestPath');
      const path = await algorithm.findBestPath(index > 0, false);
      // console.log('end: ', 'findBestPath');
      driversRoutes = await this.getDriversRoutesFromPath(path);
      // const mapR = {};
      // for (const key in driversRoutes) {
      //   mapR[key] = driversRoutes[key].map(r => {
      //     return {
      //       hired: r.hired,
      //       client: r.client.id,
      //       timeEnd: r.timeEnd,
      //       timeStart: r.timeStart
      //     };
      //   })
      // }
      // console.log('driversRoutes', globalTime, JSON.stringify(mapR));
      // iteration++;
    }
    // waitingClients = this.getWaitingClients(waitingClients, driversRoutes, globalTime);
    // console.log('waitingClients: ', waitingClients.length);
    fullDuration += this.countDuration(driversRoutes, -1);

    console.log(fullDuration);
    return fullDuration;
  }

  async getDistances(clients: Array<Client>, drivers: Array<Driver>): Promise<Array<Distance>> {
    const algorithm = new Algorithm(clients, drivers);
    return await algorithm.getDistances(true);
  }

  countDuration(driversRoutes: Array<Array<Route>>, time: number): number {
    let duration = 0;
    for (const driver of this.drivers) {
      if (driversRoutes[driver.id]) {
        // console.log('driversRoutes[driver.id]', driversRoutes[driver.id]);
        for (const route of driversRoutes[driver.id]) {
          if (route.timeEnd <= time || time === -1) {
            // console.log('route done');
            duration += route.direction.duration;
          } else if (route.timeStart <= time && route.timeEnd > time) {
            // console.log('route in progress');
            const progress = (time - route.timeStart) / (route.timeEnd - route.timeStart);
            duration += route.direction.duration * progress;
          }
        }
      }
    }
    return duration;
  }

  getFreeDrivers(driversRoutes: Array<Array<Route>>, time: number): Array<Driver> {
    // const newDriversRoutes = {};
    const freeDrivers = new Array<Driver>();
    for (const driver of this.drivers) {
      let isFree = true;
      if (driversRoutes[driver.id]) {
        for (const route of driversRoutes[driver.id]) {
          if (route.timeEnd <= time) {
            driver.location = route.direction.polyline ?
              this.getDriverLocation(route.direction.polyline, 1) :
              this.countDriverLocation(route.direction.locations.start, route.direction.locations.end, 1);
          } else if (route.timeStart <= time && route.timeEnd > time) {
            isFree = isFree && route.hired;
            const progress = (time - route.timeStart) / (route.timeEnd - route.timeStart);
            // driver.location = this.getDriverLocation(route.direction.polyline, progress);
            driver.location = route.direction.polyline ?
              this.getDriverLocation(route.direction.polyline, progress) :
              this.countDriverLocation(route.direction.locations.start, route.direction.locations.end, progress);
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

  getWaitingClients(waitingClients: Array<Client>, driversRoutes: Array<Array<Route>>, time: number): Array<Client> {
    const newWaitingClients = new Array<Client>();
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

  countDriverLocation(startLocation: LatLng, endLocation: LatLng, progress: number): LatLng {
    const lat = parseInt(startLocation.lat + '') + (parseInt(startLocation.lat + '') - parseInt(endLocation.lat + '')) * progress;
    const lng = parseInt(startLocation.lng + '') + (parseInt(startLocation.lng + '') - parseInt(endLocation.lng + '')) * progress;
    return new LatLng({
      lat, lng
    });
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
        // timeEnd: startTime + routeToClient.duration + 90, // add 1min 30sec for course service
        timeEnd: startTime + routeToClient.duration,
        direction: routeToClient,
        hired: false,
        client: client
      }));
      const routeWithClient = await this.getDirection(client.startLocation, client.endLocation, client.time);
      driversRoutes[driver.id].push(new Route({
        index: index,
        timeStart: startTime + routeToClient.duration,
        // timeEnd: startTime + routeToClient.duration + routeWithClient.duration + 90, // add 1min 30sec for course service
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
    return await googleService.getDirection(startLocation, endLocation, futureDate.getTime());
  }
}

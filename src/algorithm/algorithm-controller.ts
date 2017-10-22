import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as gapi from '@google/maps';
import { IDatabase } from "../database";
import { IServerConfigurations } from "../configurations";
// Models
import Client from './../models/client';
import Driver from './../models/driver';
import Distance from './../models/distance';
import Edge from './../models/edge';
import Node from './../models/node';
import Path from './../models/path';
// Services
import { FileService } from './../services/file.service';
import { Algorithm } from './../services/algorithm';
import { AlgorithmAnts } from './../services/algorithm.ants';
import { AlgorithmAntsMy } from './../services/algorithm.ants.my';
import { AlgorithmBees } from './../services/algorithm.bees';
import { AlgorithmGenetic } from './../services/algorithm.genetic';
import { AlgorithmNaive } from './../services/algorithm.naive';

export default class AlgorithmController {

  private configs: IServerConfigurations;
  private fileService: FileService;
  private algorithm: Algorithm;
  private algorithmAnts: AlgorithmAnts;
  private algorithmAntsMy: AlgorithmAntsMy;
  private algorithmBees: AlgorithmBees;
  private algorithmGenetic: AlgorithmGenetic;
  private algorithmNaive: AlgorithmNaive;

  constructor(configs: IServerConfigurations) {
    this.configs = configs;
    this.fileService = new FileService();
  }

  public async index(request: Hapi.Request, reply: Hapi.ReplyNoContinue) {
    const clients = this.fileService.readInput('clients1.json');
    const drivers = this.fileService.readInput('drivers.json');

    // Temporary solution (to save google requests limit)
    let distances = this.fileService.readInput('distances1on0.json');

    // this.algorithm = new Algorithm(clients, drivers, distances);
    this.algorithmAnts = new AlgorithmAnts(clients, drivers, distances);
    this.algorithmBees = new AlgorithmBees(clients, drivers, distances);
    this.algorithmGenetic = new AlgorithmGenetic(clients, drivers, distances);
    // this.algorithmNaive = new AlgorithmNaive(clients, drivers, distances);


    const pathAnts = await this.algorithmAnts.findBestPath();
    const pathBees = await this.algorithmBees.findBestPath();
    const pathGenetic = await this.algorithmGenetic.findBestPath();
    // const pathNaive = await this.algorithmNaive.findBestPath();

    reply({
      pathAnts: {
        weight: pathAnts.weight,
        time: this.algorithmAnts.bestPathFindTime,
        wholeTime: this.algorithmAnts.algorithmTime
      },
      pathBees: {
        weight: pathBees.weight,
        time: this.algorithmBees.bestPathFindTime,
        wholeTime: this.algorithmBees.algorithmTime
      },
      pathGenetic: {
        weight: pathGenetic.weight,
        time: this.algorithmGenetic.bestPathFindTime,
        wholeTime: this.algorithmGenetic.algorithmTime
      },
      // pathNaive: {
      //   weight: pathNaive.weight,
      //   time: this.algorithmNaive.bestPathFindTime,
      //   wholeTime: this.algorithmNaive.algorithmTime
      // }
    });
  }

  public async distances(request: Hapi.Request, reply: Hapi.ReplyNoContinue) {
    const clients: Array<Client> = this.fileService.readInput('clients1.json');
    const drivers = this.fileService.readInput('drivers.json');

    this.algorithm = new Algorithm(clients, drivers);

    // this.algorithm.distances = await this.algorithm.getDistances();

    const direction = await this.algorithm.getGoogleDirection(clients[0].startLocation, clients[0].endLocation);

    reply({
      // distances: this.algorithm.distances,
      direction: direction
    });
  }
}

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
import { SPVService } from "../services/spv.service";
import { Algorithm } from './../services/algorithm';
import { AlgorithmAnts } from './../services/algorithm.ants';
import { AlgorithmAntsMy } from './../services/algorithm.ants.my';
import { AlgorithmBees } from './../services/algorithm.bees';
import { AlgorithmPSABC } from "../services/algorithm.ps-abc";
import { AlgorithmGenetic } from './../services/algorithm.genetic';
import { AlgorithmNaive } from './../services/algorithm.naive';
import { Simulation } from './../services/simulation';
import { googleService } from './../services/google.service';

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
    const clients: Array<Client> = this.fileService.readInput('test9.clients.json');
    let drivers = this.fileService.readInput('test9.taxi.json');
    // drivers = drivers.slice(36,37);

    this.algorithm = new Algorithm(clients, drivers);

    this.algorithm.distances = await this.algorithm.getDistances(true);

    // const direction = await googleService.getGoogleDirection(clients[0].startLocation, clients[0].endLocation, clients[0].time);

    reply({
      distances: this.algorithm.distances,
      // direction: direction
    });
  }

  public async simulation(request: Hapi.Request, reply: Hapi.ReplyNoContinue) {
    let clients: Array<Client> = this.fileService.readInput('test9.clients.json');
    let drivers = this.fileService.readInput('test9.taxi.json');
    // drivers = drivers.slice(0,10);
    // const distances: Array<Distance> = this.fileService.readInput('test9.distances.json');

    // let params = [
    //   {
    //     initialExhaustedValue: 0.25,
    //     N: 0.1,
    //     beesAmount: 40
    //   },
    //   {
    //     initialExhaustedValue: 0.25,
    //     N: 0.1,
    //     beesAmount: 40
    //   },
    //   {
    //     initialExhaustedValue: 0.25,
    //     N: 0.1,
    //     beesAmount: 40
    //   },
    //   {
    //     initialExhaustedValue: 0.25,
    //     N: 0.1,
    //     beesAmount: 40
    //   },
    //   {
    //     initialExhaustedValue: 0.25,
    //     N: 0.1,
    //     beesAmount: 40
    //   }
    // ];
    // let params = [
    //   {
    //     crossoverProbability: 0.25,
    //     mutationProbability: 0.1,
    //     gentypesAmount: 40
    //   },
    //   {
    //     crossoverProbability: 0.25,
    //     mutationProbability: 0.1,
    //     gentypesAmount: 40
    //   },
    //   {
    //     crossoverProbability: 0.25,
    //     mutationProbability: 0.1,
    //     gentypesAmount: 40
    //   },
    //   {
    //     crossoverProbability: 0.25,
    //     mutationProbability: 0.1,
    //     gentypesAmount: 40
    //   }
    // ];
    let params = [
      {
        pheromonDecayCoefficient: 0.25,
        pheromonLocalDecayCoefficient: 0.1,
        betterEdgeCoefficient: 0.5,
        importanceInformation: 1,
        antsAmount: 40
      },
      {
        pheromonDecayCoefficient: 0.25,
        pheromonLocalDecayCoefficient: 0.25,
        betterEdgeCoefficient: 0.5,
        importanceInformation: 1,
        antsAmount: 40
      },
      {
        pheromonDecayCoefficient: 0.25,
        pheromonLocalDecayCoefficient: 0.5,
        betterEdgeCoefficient: 0.5,
        importanceInformation: 1,
        antsAmount: 40
      },
      {
        pheromonDecayCoefficient: 0.25,
        pheromonLocalDecayCoefficient: 0.75,
        betterEdgeCoefficient: 0.5,
        importanceInformation: 1,
        antsAmount: 40
      },
      {
        pheromonDecayCoefficient: 0.25,
        pheromonLocalDecayCoefficient: 1,
        betterEdgeCoefficient: 0.5,
        importanceInformation: 1,
        antsAmount: 40
      }
    ];
    console.log('--------------------startAll');
    for (const param of params) {
      console.log('--------------------start', param);
      let duration = [];
      for (let i = 0; i < 100; i++) {
        const simulation = new Simulation(JSON.parse(JSON.stringify(clients)), JSON.parse(JSON.stringify(drivers)), undefined, param);
        duration.push(await simulation.start());
      }
      console.log('--------------------end');
    }
    console.log('--------------------endAll');

    reply({
      duration: []
    });
  }

  public async test(request: Hapi.Request, reply: Hapi.ReplyNoContinue) {
    const clients = this.fileService.readInput('clients1.json');
    const drivers = this.fileService.readInput('drivers.json');

    // Temporary solution (to save google requests limit)
    let distances = this.fileService.readInput('distances1on0.json');

    const algorithmPSABC = new AlgorithmPSABC(clients, drivers, distances);
    algorithmPSABC.initExhaustedValues();
    algorithmPSABC.generateInitialPaths();
    algorithmPSABC.getBestPath();
    const neighborPath = algorithmPSABC.generateNeighborPath(algorithmPSABC.paths[0], algorithmPSABC.initialPaths[0], false);
    const neighborPathOnlooker = algorithmPSABC.generateNeighborPath(algorithmPSABC.paths[0], algorithmPSABC.initialPaths[0], true);

    reply({
      path: {
        weight: algorithmPSABC.paths[0].weight,
        path: algorithmPSABC.paths[0].toString()
      },
      neighborPath: {
        weight: neighborPath.weight,
        path: neighborPath.toString()
      },
      neighborPathOnlooker: {
        weight: neighborPathOnlooker.weight,
        path: neighborPathOnlooker.toString()
      },
    });
  }
}

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Services
const file_service_1 = require("./../services/file.service");
const algorithm_1 = require("./../services/algorithm");
const algorithm_ants_1 = require("./../services/algorithm.ants");
const algorithm_bees_1 = require("./../services/algorithm.bees");
const algorithm_ps_abc_1 = require("../services/algorithm.ps-abc");
const algorithm_genetic_1 = require("./../services/algorithm.genetic");
const simulation_1 = require("./../services/simulation");
class AlgorithmController {
    constructor(configs) {
        this.configs = configs;
        this.fileService = new file_service_1.FileService();
    }
    index(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            const clients = this.fileService.readInput('clients1.json');
            const drivers = this.fileService.readInput('drivers.json');
            // Temporary solution (to save google requests limit)
            let distances = this.fileService.readInput('distances1on0.json');
            // this.algorithm = new Algorithm(clients, drivers, distances);
            this.algorithmAnts = new algorithm_ants_1.AlgorithmAnts(clients, drivers, distances);
            this.algorithmBees = new algorithm_bees_1.AlgorithmBees(clients, drivers, distances);
            this.algorithmGenetic = new algorithm_genetic_1.AlgorithmGenetic(clients, drivers, distances);
            // this.algorithmNaive = new AlgorithmNaive(clients, drivers, distances);
            const pathAnts = yield this.algorithmAnts.findBestPath();
            const pathBees = yield this.algorithmBees.findBestPath();
            const pathGenetic = yield this.algorithmGenetic.findBestPath();
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
            });
        });
    }
    distances(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            const clients = this.fileService.readInput('test1.clients.json');
            let drivers = this.fileService.readInput('test1.taxi.json');
            // drivers = drivers.slice(36,37);
            this.algorithm = new algorithm_1.Algorithm(clients, drivers);
            this.algorithm.distances = yield this.algorithm.getDistances(true);
            // const direction = await googleService.getGoogleDirection(clients[0].startLocation, clients[0].endLocation, clients[0].time);
            reply({
                distances: this.algorithm.distances,
            });
        });
    }
    simulation(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            let clients = this.fileService.readInput('test1.clients.json');
            let drivers = this.fileService.readInput('test1.taxi.json');
            // drivers = drivers.slice(0,10);
            // const distances: Array<Distance> = this.fileService.readInput('test1.distances.json');
            console.log('--------------------start');
            let duration = [];
            for (let i = 0; i < 50; i++) {
                const simulation = new simulation_1.Simulation(JSON.parse(JSON.stringify(clients)), JSON.parse(JSON.stringify(drivers)));
                duration.push(yield simulation.start());
            }
            console.log('--------------------end');
            reply({
                duration: duration
            });
        });
    }
    test(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            const clients = this.fileService.readInput('clients1.json');
            const drivers = this.fileService.readInput('drivers.json');
            // Temporary solution (to save google requests limit)
            let distances = this.fileService.readInput('distances1on0.json');
            const algorithmPSABC = new algorithm_ps_abc_1.AlgorithmPSABC(clients, drivers, distances);
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
        });
    }
}
exports.default = AlgorithmController;
//# sourceMappingURL=algorithm-controller.js.map
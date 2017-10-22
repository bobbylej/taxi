import * as Hapi from "hapi";
import * as Joi from "joi";
import { IServerConfigurations } from "../configurations";
import AlgorithmController from "./algorithm-controller";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations) {

  const algorithmController = new AlgorithmController(serverConfigs);
  server.bind(algorithmController);

  server.route({
    method: 'GET',
    path: '/algorithm',
    config: {
      handler: algorithmController.index
    }
  });

  server.route({
    method: 'GET',
    path: '/distances',
    config: {
      handler: algorithmController.distances
    }
  });
}

import Client from './client';
import LatLng from './latlng';

export default class Route {
  index: number;
  timeStart: number;
  timeEnd: number;
  direction: Array<LatLng>;
  hired: boolean;
  client: Client;

  constructor(route: any) {
    this.index = route.index;
    this.timeStart = route.timeStart;
    this.timeEnd = route.timeEnd;
    this.direction = route.direction;
    this.hired = route.hired;
    this.client = route.client;
  }
}

import LatLng from './latlng';

export default class Client {
  id: string;
  params: Array<any>;
  startLocation: LatLng;
  endLocation: LatLng;
  distance: number;

  constructor(client: any) {
    this.id = client.id;
    this.params = client.params;
    this.startLocation = new LatLng(client.startLocation);
    this.endLocation = new LatLng(client.endLocation);
    this.distance = client.distance;
  }
}

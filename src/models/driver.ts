import LatLng from './latlng';

export default class Driver {
  id: string;
  params: Array<any>;
  location: LatLng;

  constructor(driver: any) {
    this.id = driver.id;
    this.params = driver.params;
    this.location = new LatLng(driver.location);
  }
}

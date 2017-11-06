import LatLng from './latlng';

export default class Driver {
  id: string;
  params: Array<any>;
  location: LatLng;
  duration: number;

  constructor(driver: any) {
    this.id = driver.id;
    this.params = driver.params;
    this.location = new LatLng(driver.location);
    this.duration = driver.duration || 0;
  }
}

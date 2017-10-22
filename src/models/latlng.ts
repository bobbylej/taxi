export default class LatLng {
  lat: number;
  lng: number;

  constructor(latLng: any) {
    this.lat = latLng.lat;
    this.lng = latLng.lng;
  }
}

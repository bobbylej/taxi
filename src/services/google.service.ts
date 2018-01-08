import * as gapi from '@google/maps';
// Models
import Distance from './../models/distance';
import LatLng from './../models/latlng';

export class GoogleService {
  protected googleMapsClient;

  constructor() {
    this.initGoogleApi();
  }

  private initGoogleApi() {
    this.googleMapsClient = gapi.createClient({
      // key: 'AIzaSyAPWbCNIq7JkMMH15K2H8EDzSCZwUD2JNI'
      // key: 'AIzaSyB0hSN1QhrjZ4Qzdu1YH3E_RvBINVCrt_A'
      key: 'AIzaSyBXTZogSxhfwrK_smDpOTFUBsWyoKW9ejU'
      // key: 'AIzaSyBjM41yg497raGt39tY2D4uDwKB6q-f7mg'
      // key: 'AIzaSyBwqV7_WK6S6uWGVLbY89BvTMhDaGCwNkQ'
    });
  }

  // async getGoogleDistance(location1: LatLng, location2: LatLng): Promise<any> {
  //   return await new Promise((resolve, reject) => {
  //     this.googleMapsClient.distanceMatrix({
  //       origins: { lat: location1.lat, lng: location1.lng },
  //       destinations: { lat: location2.lat, lng: location2.lng }
  //     }, (err: any, response: any) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       const distance = new Distance({
  //         distance: response.json.rows[0].elements[0].distance.value,
  //         duration: response.json.rows[0].elements[0].duration.value
  //       });
  //       return resolve(distance);
  //     });
  //   });
  // }

  // async getGoogleDistances(origins: Array<{id: string, location: LatLng}>, destinations: Array<{id: string, location: LatLng}>): Promise<any> {
  //   const distances = {};
  //   const locationsOrigins = [];
  //   origins.forEach(origin => {
  //     locationsOrigins.push(origin.location);
  //   });
  //   const locationsDestinations = [];
  //   destinations.forEach(destination => {
  //     locationsDestinations.push(destination.location);
  //   });
  //   return await new Promise((resolve, reject) => {
  //     this.googleMapsClient.distanceMatrix({
  //       origins: locationsOrigins,
  //       destinations: locationsDestinations
  //     }, (err: any, response: any) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       for (let r = 0; r < response.json.rows.length; r++) {
  //         distances[origins[r].id] = {};
  //         for (let e = 0; e < response.json.rows[r].elements.length; e++) {
  //           distances[origins[r].id][destinations[e].id] = new Distance({
  //             distance: response.json.rows[r].elements[e].distance.value,
  //             duration: response.json.rows[r].elements[e].duration.value
  //           });
  //         }
  //       }
  //       return resolve(distances);
  //     });
  //   });
  // }

  getDistances(origins: Array<{id: string, location: LatLng}>, destinations: Array<{id: string, location: LatLng}>): Promise<any> {
    const distances = {};
    origins.forEach(origin => {
      destinations.forEach(destination => {
        if (!distances[origin.id]) {
          distances[origin.id] = {};
        }
        distances[origin.id][destination.id] = this.getDistance(origin.location, destination.location);
      });
    });
    return new Promise((resolve, reject) => resolve(distances));
  }

  getDistance(location1: LatLng, location2: LatLng): Distance {
    const p = 0.017453292519943295;    // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((location2.lat - location1.lat) * p)/2 +
            c(location1.lat * p) * c(location2.lat * p) *
            (1 - c((location2.lng - location1.lng) * p))/2;
    const distance = 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    return new Distance({
      distance: distance,
      duration: distance / 60 * 3600
    });
  }

  getGoogleDirection(origin: LatLng, destination: LatLng, time: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.googleMapsClient.directions({
        origin: origin,
        destination: destination,
        departure_time: time
      }, (err: any, response: any) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        const direction = {
          distance: response.json.routes[0].legs[0].distance.value,
          duration: response.json.routes[0].legs[0].duration.value,
          polyline: this.decodePolyline(response.json.routes[0].overview_polyline.points),
          locations: {
            start: origin,
            end: destination
          }
        }
        resolve(direction);
      });
    });
  }

  getDirection(origin: LatLng, destination: LatLng, time: number): Promise<any> {
    const distance = this.getDistance(origin, destination);
    const direction = {
      ditance: distance.distance,
      duration: distance.duration,
      locations: {
        start: origin,
        end: destination
      }
    };
    return new Promise((resolve, reject) => resolve(direction));
  }

  decodePolyline(encoded: string): Array<LatLng> {
    const points = new Array<LatLng>();
    let index = 0
    let lat = 0, lng = 0;
    while (index < encoded.length) {
      var b, shift = 0, result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push(new LatLng({ lat: (lat / 1E5), lng: (lng / 1E5) }))
    }
    return points
  }
}

export const googleService = new GoogleService();

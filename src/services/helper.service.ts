// Models
import Edge from './../models/edge';

export class HelperService {
  logEdges(edges: Array<Edge>): void {
    let pathEdges = '';
    pathEdges += edges[0].startNode.id;
    edges.forEach((edge: Edge) => {
      pathEdges += ' -' + '-> ' + edge.endNode.id;
    });
    console.log(pathEdges);
  }

  isSuperArray(array1, array2): boolean {
    const array1Copy = Object.assign([], array1);
    if (array2.length > array1Copy.length) {
      return false;
    } else {
      for (let i = 0; i < array2.length; i++) {
        const index = array1Copy.indexOf(array2[i]);
        if (index === -1) {
          return false;
        } else {
          array1Copy.splice(index, 1);
        }
      }
      return true;
    }
  }

  findIndex(array: Array<any>, compareObject: any): number {
    let index = -1;
    array.forEach((item, i) => {
      const keys = Object.keys(compareObject);
      let match = true;
      keys.forEach(key => {
        match = match && item[key] === compareObject[key];
      })
      index = match ? i : index;
    });
    return index;
  }
}

export const helperService = new HelperService();

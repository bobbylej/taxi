export class SPVService {
  spv(vector: Array<number>): Array<number> {
    const valuesWithIndex = [];
    const indeces = [];
    vector.forEach((value, index) => {
      valuesWithIndex.push({value, index});
    });
    valuesWithIndex.sort((left, right) => {
      return left.value < right.value ? -1 : 1;
    });
    valuesWithIndex.forEach(({value, index}) => {
      indeces.push(index);
    });
    return indeces;
  }

  gspv(vector: Array<number>): Array<number> {
    const indeces = vector.map(value => {
      return Math.floor(Math.abs(value));
    });
    const spvVector = vector.map(value => {
      return value - (value < 0 ? -1 : 1) * Math.floor(Math.abs(value));
    });
    const spvIndeces = this.spv(spvVector);
    const result = [];
    spvIndeces.forEach(spvIndex => {
      result.push(indeces[spvIndex]);
    });
    return result;
  }
}

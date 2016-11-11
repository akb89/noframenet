import _ from 'lodash';

if (!Array.prototype.flatten) {
  Array.prototype.flatten = () => {
    return _.flatten(this);
  };
}

if (!Array.prototype.chunk) {
  Array.prototype.chunk = function (chunkLength) {
    const chunks = [];
    if (this.length <= chunkLength) {
      chunks.push(this);
      return chunks;
    }
    let iterator = 0;
    while (iterator + chunkLength <= this.length) {
      chunks.push(this.slice(iterator, iterator + chunkLength));
      iterator += chunkLength;
    }
    if (this.slice(iterator).length !== 0) {
      chunks.push(this.slice(iterator));
    }
    return chunks;
  }
}

function createGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(char) {
    var rand = Math.random()*16|0, charReplacement = (char == 'x') ? rand : (rand&0x3|0x8);

    return charReplacement.toString(16);
  });
}

module.exports = createGuid;

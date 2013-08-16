var fs = require('fs'),
    stringOptions = fs.readFileSync("config.json", {encoding: 'utf8'}),
    options = JSON.parse(stringOptions),
    tableAreas = options.tableAreas,
    probabilisticTableBuckets = makeProbabilisticBuckets(options.tableAreas);

function makeProbabilisticBuckets(tableAreas) {
  var totalNumberOfTables = 0;
  for(var i = 0; i < tableAreas.length; i++) {
    totalNumberOfTables += tableAreas[i].numberOfTables;
  }

  var currentProb = 0, buckets = [];
  for(var i = 0; i < tableAreas.length; i++) {
    var range = tableAreas[i].numberOfTables/totalNumberOfTables;
    buckets.push({probMax: currentProb + range, name: tableAreas[i].name});
  }

  return buckets;
};

exports.pickMatchTable = function pickMatchTable() {
  var prob = Math.random();

  var runningProb = 0;
  for(var i = 0; i < tableAreas.length; i++) {
    runningProb += probabilisticTableBuckets[i].probMax;
    if(prob < runningProb) {
      return probabilisticTableBuckets[i].name;
    }
  }

  return probabilisticTableBuckets[0].name;
};

var redisClient = require("./redis_client"),
    createGuid = require("./create_guid"),
    tables = require("./tables");

function MatchRequest(guid, data) {
  var self = this;

  self.scheduleForMatch = function() {
    var matchTypes = {
      singles: { maxNumOfPlayers: 2 },
      doubles: { maxNumOfPlayers: 4 }
    };

    var neededNumberOfPlayers = matchTypes[data.matchType].maxNumOfPlayers - data.numPlayers,
    newMatchKey = data.matchType + ":" + neededNumberOfPlayers,
    pendingMatchKey = data.matchType + ":" + data.numPlayers;

    function transactionallyScheduleMatch() {
      var tryNumber = 1;
      var repeatFunction = function(err) {
        if(err && (tryNumber++ < 3)) {
          transactionallScheduleMatch();
        }
      };

      redisClient.watch(pendingMatchKey);
      var max = function(a, b) { return a > b ? a : b },
      min = function(a, b) { return a < b ? a : b },
      pendingGuid = redisClient.get(pendingMatchKey),
      pendingOpponentNames = redisClient.hmget(pendingGuid, 'names'),
      expirationTime = min(max(data.requestTTL || 9*60, 1), 9*60) * 60;

      redisClient.get(pendingMatchKey, function(err, pendingGuid){
        redisClient.hmget(pendingGuid, 'names', function(err, pendingOpponentNames){
          if(pendingGuid) {
            var matchGuid = createGuid(),
            selectedTableName = tables.pickMatchTable();

            redisClient.multi()
            .del(pendingMatchKey)
            .hset(pendingGuid, 'scheduledMatchGuid', matchGuid)
            .hset(guid, 'scheduledMatchGuid', matchGuid)
            .hset(pendingGuid, 'confirmed', 0)
            .hset(guid, 'confirmed', 0)
            .hmset(matchGuid, {team1: pendingGuid, team2: guid, tableName: selectedTableName})
            .expire(matchGuid, 80)
            .expire(pendingGuid, 80)
            .expire(guid, 80)
            .exec(repeatFunction);
          } else {
            redisClient.multi()
            .set(newMatchKey, guid)
            .expire(newMatchKey, expirationTime)
            .expire(guid, expirationTime)
            .exec(repeatFunction);
          }
        });
      });
    }

    transactionallyScheduleMatch();
  };

  self.save = function(callback) {
    redisClient.hmset(guid, data, callback);
  };

  self.scheduledMatchGuid = function() {
    return data.scheduledMatchGuid;
  };
}

MatchRequest.withGuid = function(guid, callback) {
  redisClient.hgetall(guid, function(err, data) {
    if(!data) {
      callback();
    } else {
      callback(new MatchRequest(guid, data));
    }
  });
};

module.exports = MatchRequest;

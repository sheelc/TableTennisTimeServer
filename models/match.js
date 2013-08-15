var redisClient = require("./redis_client");

function Match(guid, data) {
  var self = this;

  self.getStatus = function(callback) {
    redisClient.hgetall(data.team1, function(err, team1){
      redisClient.hgetall(data.team2, function(err, team2){
        redisClient.ttl(guid, function(err, ttl){
          var status = {timeRemaining: ttl, assignedTable: data.tableName};
          status.teams = [{names: team1.names, confirmed: team1.confirmed}, {names: team2.names, confirmed: team2.confirmed}];
          status.scheduled = (team1.confirmed < 0 || team2.confirmed < 0) ? -1 : team1.confirmed * team2.confirmed;

          callback(status);
        });
      });
    });
  };

  self.updateConfirmationForGuid = function(matchRequestGuid, confirmed, callback) {
    var confirmedState = confirmed ? 1 : -1;
    redisClient.hset(matchRequestGuid, 'confirmed', confirmedState, function(err, response) {
      callback();
    });
  };
}

Match.withGuid = function(guid, callback) {
  redisClient.hgetall(guid, function(err, response) {
    if(!response) {
      callback();
    } else {
      callback(new Match(guid, response));
    }
  });
};

module.exports = Match;

exports.init = function init(app) {

  var redis = require("redis"), redisClient;
  if (process.env.VCAP_SERVICES) {
    var serviceCredentials = JSON.parse(process.env.VCAP_SERVICES)["rediscloud-n/a"][0].credentials;
    redisClient = redis.createClient(serviceCredentials.port, serviceCredentials.hostname);
    redisClient.auth(serviceCredentials.password);
  } else {
    redisClient = redis.createClient();
  }

  app.post('/matches', function(req, res){
    console.log(req.body);

    function guid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(char) {
        var rand = Math.random()*16|0, charReplacement = (char == 'x') ? rand : (rand&0x3|0x8);

        return charReplacement.toString(16);
      });
    }

    var requestGuid = guid();
    setTimeout(function() { scheduleMatch(req.body, requestGuid) }, 0);
    saveMatch(requestGuid, req.body, function() { res.send({guid: requestGuid}) });
  });

  app.get('/matches/:guid', function(req, res){
    console.log('polling received for: ' + req.params.guid);
    redisClient.hgetall(req.params.guid, function(err, savedMatch){
      if(!savedMatch) {
        res.status(404).send({});
        return;
      }

      if(savedMatch.opponentNames) {
        res.send({opponentNames: savedMatch.opponentNames, assignedTable: "5th floor tables"});
      } else {
        res.status(304).send({});
      }
    });
  });

  var saveMatch = function(guid, matchDetails, callback){
    redisClient.hmset(guid, matchDetails, callback);
  };

  var scheduleMatch = function(matchDetails, guid){
    var matchTypes = {
      singles: { maxNumOfPlayers: 2 },
      doubles: { maxNumOfPlayers: 4 }
    };

    var neededNumberOfPlayers = matchTypes[matchDetails.matchType].maxNumOfPlayers - matchDetails.numPlayers,
    newMatchKey = matchDetails.matchType + ":" + neededNumberOfPlayers,
    pendingMatchKey = matchDetails.matchType + ":" + matchDetails.numPlayers;

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
      expirationTime = min(max(matchDetails.requestTTL || 9*60, 1), 9*60) * 60;

      redisClient.get(pendingMatchKey, function(err, pendingGuid){
        redisClient.hmget(pendingGuid, 'names', function(err, pendingOpponentNames){
          if(pendingGuid) {
            redisClient.multi()
            .del(pendingMatchKey)
            .hset(pendingGuid, 'opponentNames', matchDetails.names)
            .expire(pendingGuid, 60 * 60)
            .expire(guid, 60 * 60)
            .hset(guid, 'opponentNames', pendingOpponentNames)
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
}


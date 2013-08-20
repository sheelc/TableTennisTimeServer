exports.init = function init(app) {

  var MatchRequest = require("../models/match_request"),
      createGuid = require("../models/create_guid");

  app.post('/match_requests', function(req, res){
    console.log(req.body);
    var requestGuid = createGuid(),
        matchRequest = new MatchRequest(requestGuid, req.body);

    setTimeout(matchRequest.scheduleForMatch, 0);
    matchRequest.save(function() { res.send({guid: requestGuid}) });
  });

  app.get('/match_requests/:guid', function(req, res){
    console.log('polling received for: ' + req.params.guid);
    MatchRequest.withGuid(req.params.guid, function(match) {
      if(!match) {
        res.status(404).send({});
        return;
      }

      if(match.scheduledMatchGuid()) {
        res.send({scheduledMatchGuid: match.scheduledMatchGuid()});
      } else {
        res.status(304).send({});
      }
    });
  });
}


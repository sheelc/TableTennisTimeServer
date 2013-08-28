exports.init = function init(app) {

  var MatchRequest = require("../models/match_request"),
      createGuid = require("../models/create_guid"),
      logger = require("../models/logger");

  app.post('/match_requests', function(req, res){
    logger.log(req.body);
    var requestGuid = createGuid(),
        matchRequest = new MatchRequest(requestGuid, req.body);

    setTimeout(matchRequest.scheduleForMatch, 0);
    matchRequest.save(function() { res.send({guid: requestGuid}) });
  });

  app.get('/match_requests/:guid', function(req, res){
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


exports.init = function init(app, options) {

  var Match = require("../models/match");

  app.get('/matches/:guid', function(req, res){
    Match.withGuid(req.params.guid, function(match) {
      if(!match) {
        res.status(404).send({});
        return;
      }

      match.getStatus(function(status) {
        res.send(status);
      });
    });
  });

  app.put('/matches/:guid', function(req, res){
    Match.withGuid(req.params.guid, function(match) {
      if(!match) {
        res.status(404).send({});
        return;
      }

      match.updateConfirmationForGuid(req.body.matchRequestGuid, req.body.accepted, function() {
        res.send({});
      });
    });
  });
};

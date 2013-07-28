process.on('uncaughtException', function(err){
  console.error(err);
});

var express = require('express');
var app = express();
app.use(express.bodyParser());

app.get('/info', function(req, res){
  res.send({version: 1});
});

var fs = require('fs'),
    path = require('path');

var routeDir = 'routes',
    files = fs.readdirSync(routeDir);

files.forEach(function(file) {
  var filePath = path.resolve('./', routeDir, file),
      route = require(filePath);
      route.init(app);
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port ' + port);


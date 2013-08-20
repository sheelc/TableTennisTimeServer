process.on('uncaughtException', function(err){
  console.error(err.stack);
});

var fs = require('fs'),
    express = require('express'),
    ipFiltering = require("./middleware/ip_filtering"),
    options = JSON.parse(fs.readFileSync("config.json", {encoding: 'utf8'}));

var app = express();
app.use(ipFiltering.filterIps(options.whitelistedIps));
app.use(express.bodyParser());

app.get('/', function(req, res) {
  res.sendfile('public/index.html');
});

app.use('/public', express.static(__dirname + '/public'));

app.get('/info', function(req, res){
  res.send({version: 2});
});

var path = require('path'),
    routeDir = "routes",
    routeFiles = fs.readdirSync(routeDir);

routeFiles.forEach(function(file) {
  var filePath = path.resolve('./', routeDir, file),
      route = require(filePath);

  route.init(app);
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port ' + port);


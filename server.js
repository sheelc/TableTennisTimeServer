var express = require('express');
var app = express();
app.use(express.bodyParser());

app.get('/info', function(req, res){
  res.send({version: 1});
});

app.listen(3000);
console.log('Listening on port 3000');


var express = require('express');
var app = express();
app.use(express.bodyParser());

app.get('/info', function(req, res){
  res.send({version: 1});
});

app.post('/matches', function(req, res){
  console.log(req.body);
  function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(char) {
      var rand = Math.random()*16|0, charReplacement = (char == 'x') ? rand : (rand&0x3|0x8);

      return charReplacement.toString(16);
    });
  }

  res.send({guid: guid()});
});

app.listen(3000);
console.log('Listening on port 3000');


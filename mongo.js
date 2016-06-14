var http = require('http');
var db = require('monk')('localhost/example');

var collection = db.get('collection');

function handleRequest(req, res){
  if (req.url === '/drop') {
    collection.remove({}, function(err, data) {
      res.end();
    });
  } else if (req.url === '/view') {
    var stuff = collection.find({}, function(err, data) {
      console.log(data);
      res.write(data);
      res.end();
    });
  } else {
    var date = new Date();
    var ip = req.connection.remoteAddress;
    collection.insert({date: date, ip: ip});
    res.end(ip + ' ' + date);
  }
}

var server = http.createServer(handleRequest);
server.listen(9001);
console.log("It's over 9000!!!");

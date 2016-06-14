var fs = require('fs');
var http = require('http');
var pug = require('pug');
var db = require('monk')('localhost/muchpractice');
var cats = db.get('cats');
var qs = require('querystring');

var routes = {
  '/cats' : 'getcats.pug',
  '/cats/new': 'createcats.pug',
  '/cats/:id/edit': 'editcats.pug'
}

function handleRequest(req, res) {
  if (req.url === '/favicon.ico') return;
  // var id = req.url.match(/\d+/g);
  // if (id) id = id[0];
  // req.url = req.url.replace(/\d+/g, ':id');
  var urlArr = req.url.split('/');
  if (urlArr[2]) {
    if (!isNaN(Number(urlArr[2].charAt(0)))) {
      var id = urlArr[2];
      urlArr[2] = ':id';
    }
  }
  var jointUrl = urlArr.join('/');
  var fileName = routes[jointUrl];
  var file = req.method === 'GET' ? pug.compileFile(fileName) : pug.compileFile('getcats.pug');
  if (req.method === 'GET') {
    seeCats(catCallback, res, file);
  } else if (req.method === 'POST') {
    if (id && jointUrl !== '/cats/:id/adopt') {
      parseRequestBody(req, editCat, res, file, id);
    } else if (jointUrl === '/cats/:id/adopt') {
      adoptCat(res, file, id);
    } else {
      parseRequestBody(req, insertCats, res, file);
    }
  }
}

function seeCats(fn, res, file) {
  cats.find({}, function(err, data) {
    if (err) throw err;
    fn(data, res, file);
  });
};

function catCallback(data, res, file) {
  var obj = {data: data}
  var html = file(obj);
  res.end(html);
}

function parseRequestBody(req, fn, res, file, id) {
  var body = '';
  req.on('data', function(data) {
    body += data;
    if (body.length > 1e6) req.connection.destroy();
    var post = qs.parse(body);
    fn(post, res, file, id);
  });
}

function insertCats(post, res, file) {
  post.error = [];
  if (post.name.length < 2) {
    post.error.push("Your Cat's name is too short");
  }
  if (post.name.match(/\W/)) {
    post.error.push("Your Cat's name cannot contain special characters");
  }
  console.log(post.error.length);
  if (post.error.length === 0) {
    cats.insert({name: post.name, color: post.color}, function(err, data){
      if(err) throw err;
      seeCats(catCallback, res, file)
    });
  } else {
    var newFile = pug.compileFile('createcats.pug');
    var obj = {data: post}
    var html = newFile(obj);
    res.end(html);
  }
}

function editCat(post, res, file, id) {
  cats.updateById(id, {_id: id, name: post.newName, color: post.newColor}, function(err, data) {
    if (err) throw err;
    seeCats(catCallback, res, file);
  });
}

function adoptCat(res, file, id) {
  console.log('IN HEREEREREREEE');
  cats.remove({_id: id});
  seeCats(catCallback, res, file);
}
var server = http.createServer(handleRequest);
server.listen(9001);
console.log("It's over 9000!!!");

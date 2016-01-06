var cookieParser = require('cookie-parser');
var eaExpressMiddleware = require('../../plugins/express-middleware');

var path = require('path');
var express = require('express');
var app = express();

app.use(function (req, res, next) {
  res.append('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.static('.'));
app.use(express.static('./pages'));
app.use(express.static('./data'));
app.use(express.static('./data'));
app.use(express.static('../dist'));
app.use(express.static('../node_modules/jquery/dist'));

app.use(cookieParser());
app.use(eaExpressMiddleware(require('../data/mocks')));


app.get('/favicon.ico', function (req, res) {
  res.send('');
});

app.all('*', function (req, res) {
  req.data = req.body;
  console.log(req.params, req.query, req.data);
  res.send('It works!');
});


app.listen(3000, function () {
  console.log('\nFrontend server listen on localhost:3000\n');
});

var cookieParser = require('cookie-parser');
var eaExpressMiddleware = require('../plugins/express-middleware');

var path = require('path');
var express = require('express');
var app = express();

app.use(function (req, res, next) {
  res.append('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.static('.'));
app.use(express.static('..'));

app.use(cookieParser());
app.use(eaExpressMiddleware(require('./shared-options')));


app.get('/favicon.ico', function (req, res) {
  res.send('');
});

app.all('*', function (req, res) {
  req.data = req.body;
  console.log(req.params, req.query, req.data);
  res.send('It works!');
});


app.listen(3000, function () {
  console.log('\nServer on http://localhost:3000/\n');
});

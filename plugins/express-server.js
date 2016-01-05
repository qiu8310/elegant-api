var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var eaExpressMiddleware = require('./express-middleware');

var app = require('express')();


app.use(cookieParser);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var baseOptions = {};
var mockOptions = {};
app.use(eaExpressMiddleware(baseOptions, mockOptions));

app.get('/favicon.ico', function (req, res) {
  res.send('');
});

app.all('*', function (req, res) {
  req.data = req.body;
  console.log(req.params, req.data, req.query);
  res.send('It works!');
});


app.listen(3000, function () {
  console.log('http://localhost:3000/');
});

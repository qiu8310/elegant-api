var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var eaExpressMiddleware = require('./express-middleware');

module.exports = function (config) {

  var app = require('express')();

  app.use(function (req, res, next) {
    res.append('Access-Control-Allow-Origin', '*');
    res.append('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.append('Access-Control-Allow-Headers',
      'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
    next();
  });

  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(eaExpressMiddleware(config.mocks));

  app.all('*', function (req, res) {
    req.data = req.body;
    console.log(req.params, req.data, req.query);
    res.send('No mock!');
  });

  var port = config.port || 3000;
  var host = config.host || config.hostname || '0.0.0.0';

  app.listen(port, host, function () {
    console.log('http://' + host + ':' + port);
  });
};

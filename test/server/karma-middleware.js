var cookieParser = require('cookie-parser')();

module.exports = function (config) {
  return function (req, res, next) {
    cookieParser(req, res, function () {

      var result = {
        url: req.url,
        method: req.method,
        cookies: req.cookies,
        random: Math.random(),
        from: 'karma-middleware'
      };

      var status = /\berror\b/.test(req.url) ? 500 : 200;

      res.writeHead(status, {
        'Content-Type': 'application/json'
      });

      return res.end(JSON.stringify(result));

    });
  };
};

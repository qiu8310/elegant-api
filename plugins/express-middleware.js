var base = require('./base');
var proxy = require('./express-proxy');

module.exports = function (mockOptions) {

  base.init(mockOptions);

  return function elegantApiExpressMiddleware(req, res, next) {
    var http, eaData = req.query.__eaData, key = req.query.__ea;

    if (!key) return next();

    if (!eaData && !req.cookies) {
      base.writeWarn('\nYou should use `cookie-parser` middleware before elegant-api middleware.\n');
      return next();
    }

    eaData = eaData || req.cookies['__ea' + key];
    res.clearCookie('__ea' + key);

    try {
      http = base.parse(eaData);
    } catch (obj) {
      return res.status(500).json(obj);
    }

    if (http.mock.proxy) {
      proxy(http.mock.proxy, req, res, next);
    } else {
      base.mock(key, http, function (err, data) {
        if (err) res.status(500).json(err);
        else res.json(data);
      });
    }
  };

};

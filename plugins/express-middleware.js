var ElegantApi = require('../dist/elegant-api').ElegantApi;

module.exports = function (baseOptions, mockOptions) {

  var EA = new ElegantApi(baseOptions, mockOptions);

  return function elegantApiExpressMiddleware(req, res, next) {
    var key = req.query.__ea;

    if (!key) return next();
    if (!req.cookies) {
      console.warn('\n\x1b[33mYou should use cookie-parser middleware before elegant-api middleware.\x1b[0m\n');
      return next();
    }

    EA.responseMock(key, JSON.parse(req.cookies.__ea), function (err, data) {
      if (err) {
        res.status(500).json(err instanceof Error ? {error: err.message} : err);
      } else {
        res.json(data);
      }
    });

  };

}

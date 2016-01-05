var ElegantApi = require('../dist/elegant-api').ElegantApi;

module.exports = function (baseOptions, mockOptions) {

  var EA = new ElegantApi(baseOptions, mockOptions);

  return function elegantApiExpressMiddleware(req, res, next) {
    var eaQuery = req.query.__ea, eaCookie;

    if (!eaQuery) return next();

    eaQuery = eaQuery.split('|');
    var key = eaQuery[0];
    // var mock = eaQuery[1];

    if (!req.cookies) {
      console.warn('\n\x1b[33mYou should use cookie-parser middleware before elegant-api middleware.\x1b[0m\n');
      return next();
    }

    eaCookie = req.cookies['__ea' + key];

    try {

      EA.responseMock(key, JSON.parse(eaCookie), function (err, data) {
        if (err) {
          res.status(500).json(err instanceof Error ? {error: err.message} : err);
        } else {
          res.json(data);
        }
      });

    } catch (e) {
      res.status(500).json({error: 'Parse http cookie error', cookie: eaCookie});
    }
  };
};

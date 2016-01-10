import OPTIONS from './options';

let cookieParser = require('cookie-parser');
let eaExpressMiddleware = require('../../plugins/express-middleware');
let app = require('express')();

app.use(function (req, res, next) {
  res.append('Access-Control-Allow-Origin', '*');
  console.log('fe-server:', req.url);
  next();
});

app.use(cookieParser());
app.use(eaExpressMiddleware(require('./options')));


let path = OPTIONS._server;
let [host, port] = path.split(':');

console.log('Config', OPTIONS.mock);

let server = app.listen(port, host, () => {
  server.__uped = true;
  if (server.__up) server.__up();

  console.log('Test fe server start on ' + path);
});

export default server;

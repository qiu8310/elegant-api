import OPTIONS from './options';

let cookieParser = require('cookie-parser');
let eaExpressMiddleware = require('../../plugins/express-middleware');
let app = require('express')();

app.use(function (req, res, next) {
  res.append('Access-Control-Allow-Origin', '*');
  next();
});

app.use(cookieParser());
app.use(eaExpressMiddleware(require('./options')));


let [, path] = OPTIONS.mock.split('//');
let [host, port] = path.split(':');

let server = app.listen(port, host, () => {
  if (server.__up) server.__up();
  server.__uped = true;

  console.log('Test engine server start on ' + path);
});

export default server;

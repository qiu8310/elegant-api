import OPTIONS from './options';

let app = require('express')();

app.use(function (req, res, next) {
  res.append('Access-Control-Allow-Origin', '*');
  next();
});


app.all('*', function (req, res) {
  console.log(req.url, '\n');
  res.json(req.query);
});


let path = OPTIONS._proxy.replace(/^.*\/\//, '');
let [host, port] = path.split(':');

console.log('Config', {proxy: OPTIONS._proxy});

let server = app.listen(port, host, () => {
  server.__uped = true;
  if (server.__up) server.__up();

  console.log('Test rd server start on ' + path);
});

export default server;

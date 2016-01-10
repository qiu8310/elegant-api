import OPTIONS from './options';

let app = require('express')();

app.use(function (req, res, next) {
  res.append('Access-Control-Allow-Origin', '*');
  console.log('rd-server:', req.url);
  next();
});


app.all('*', function (req, res) {
  console.log(req.url, '\n');
  var result = {
    url: req.url,
    method: req.method,
    query: req.query,
    from: 'rd-server'
  };
  res.json(result);
});


let path = OPTIONS._proxy;
let [host, port] = path.split(':');

console.log('Config', {proxy: OPTIONS._proxy});

let server = app.listen(port, host, () => {
  server.__uped = true;
  if (server.__up) server.__up();

  console.log('Test rd server start on ' + path);
});

export default server;

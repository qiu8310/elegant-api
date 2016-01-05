import http from 'http';
import qs from 'querystring';
import bodyParser from 'body-parser';

import ElegantApi from '../../src/ElegantApi';
import OPTIONS from './options';

let jsonParser = bodyParser.json();
let urlencodedParser = bodyParser.urlencoded({extended: false});

let EA = new ElegantApi(OPTIONS);


function mock(EA, key, req, res, callback) {

  jsonParser(req, res, err => {
    if (err) return callback(err);

    urlencodedParser(req, res, err => {
      if (err) return callback(err);

      let [, query] = req.url.split('?');

      req.query = qs.decode(query);
      req.data = req.body;

      EA.responseMock(key, req, callback);

    });
  });
}


let app = http.createServer((req, res) => {
  var url = req.url,
    status = 200,
    end = function (data) {
      res.write(JSON.stringify(data));
      res.end();
    };

  if (/\berror\b/i.test(url)) {
    status = 500;
  }

  res.writeHead(status, {
    'Content-Type': 'application/json;charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });

  if (status !== 200) return end({});

  if (/\bcloseServer\b/i.test(url)) {
    app.close();
  } else if (/\b__ea=(\w+)/.test(url)) {
    return mock(EA, RegExp.$1, req, res, (err, data) => {
      if (err) end({status: -2, message: 'http request error', error: err});
      else {
        if (data.status) end(data);
        else end({status: 0, message: 'ok', data});
      }
    });
  } else {
    end({status: -1, message: 'No __ea parameter'});
  }
});


let [, path] = OPTIONS.mock.split('//');
let [host, port] = path.split(':');
console.log('Server start listen ' + path);
app.listen(port, host, () => {
  if (app.__up) app.__up();
  app.__uped = true;
});

export default app;

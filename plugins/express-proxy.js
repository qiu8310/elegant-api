var url = require('url');
var http = require('http');
var https = require('https');

var getRawBody = require('raw-body');

var SKIP_HEADERS = ['connection', 'content-length'];

module.exports = function proxy(host, req, res, next) {
  console.log('Proxy to %s %s\n', host, req.url);

  var isHttps = /^https|[^\/]*:443/.test(host);
  var hostname = host.replace(/^\w*:?\/\//g, '').replace(/(:|\/).*$/, '');
  var port = /\w*:?\/\/[^\/]*:(\d+)/.test(host) ? parseInt(RegExp.$1, 10) : (isHttps ? 443 : 80);

  var headers = extend({}, req.headers, SKIP_HEADERS);
  headers.connection = 'close';

  getRawBody(req, {length: req.headers['content-length'], limit: '10mb'}, function (err, bodyContent) {
    if (err) return next(err);

    var reqOpt = {
      hostname: hostname,
      port: port,
      headers: headers,
      method: req.method,
      path: url.parse(req.url).path
    };

    if (typeof bodyContent === 'string')
      headers['content-length'] = Buffer.byteLength(bodyContent);
    else if (Buffer.isBuffer(bodyContent))
      headers['content-length'] = bodyContent.length;

    var proxyRequest = getProxyRequest(isHttps, reqOpt, res, next);

    proxyRequest.on('error', function (e) {
      next(e);
    });

    if (bodyContent.length) {
      proxyRequest.write(bodyContent);
    }

    proxyRequest.end();
  });
};

function getProxyRequest(isHttps, reqOpt, res, next) {
  var chunks = [];
  return (isHttps ? https : http).request(reqOpt, function (proxResponse) {
    proxResponse.on('data', function (chunk) {
      chunks.push(chunk);
    });

    proxResponse.on('error', function (e) {
      next(e);
    });

    proxResponse.on('end', function () {
      var totalLength = chunks.reduce(function (len, buf) {
        return len + buf.length;
      }, 0);

      var rspData = Buffer.concat(chunks, totalLength);

      res.send(rspData);
    });

    if (!res.headersSent) { // if header is not set yet
      res.status(proxResponse.statusCode);
      for (var p in proxResponse.headers) {
        res.set(p, proxResponse.headers[p]);
      }
    }
  });
}

function extend(obj, source, skips) {
  if (!source) return obj;

  for (var prop in source) {
    if (!skips || skips.indexOf(prop) === -1)
      obj[prop] = source[prop];
  }

  return obj;
}

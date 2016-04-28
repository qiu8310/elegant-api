// 依赖于 Promise

import {extend, objectKeys} from './util';

export function mixin(context) {

  context.$objectify = function (target, key) {
    return promisify(context, key, target, true);
  };

  context.$objectifyAll = function (target, keys) {
    return Promise.all([].concat(keys).map(function (key) {
      return context.$objectify(target, key);
    }));
  };

  context.$fetch = function (target, key, conf) {
    if (conf && conf.body) {
      conf.data = conf.body;
      delete conf.body;
    }
    return promisify(context, key, extend({}, target, conf));
  };

  context.$fetchAll = function (target, obj) {
    let keys = objectKeys(obj);

    return Promise.all(keys.map(function (key) {
      return context.$fetch(target, key, obj[key]);
    })).then(list => {
      return Promise.resolve(keys.reduce((all, key, index) => {
        all[key] = list[index];
        return all;
      }, {}));
    });
  };
}

function promisify(context, key, target, save) {
  return new Promise((resolve, reject) => {
    if (typeof context[key] !== 'function') {
      return resolve(context[key]);
    }

    context[key](target, function (err, data) {
      if (err) {
        reject(err);
      } else {
        if (save) context[key] = data;
        resolve(data);
      }
    });
  });
}



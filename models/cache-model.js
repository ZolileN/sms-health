const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 60 * 2 });

module.exports = {
  get(key) {
    return cache.get(key);
  },
  set(key, value) {
    return cache.set(key, value);
  },
  delete(key) {
    return cache.del(key);
  },
  extendTTL(key) {
    return new Promise((resolve, reject) => {
      cache.ttl(key, 60 * 60 * 24, (err, changed) => {
        if (err) {
          reject(err);
        } else {
          resolve(changed);
        }
      });
    });
  },
  getAllKeys() {
    return new Promise((resolve, reject) => {
      cache.keys((err, keys) => {
        if (err) {
          reject(err);
        } else {
          resolve(keys);
        }
      });
    });
  },
};

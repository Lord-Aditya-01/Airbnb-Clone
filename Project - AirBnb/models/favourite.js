const fs = require('fs');
const path = require('path');
const rootDir = require('../utils/pathUtil');

const FavouriteDataPath = path.join(rootDir, 'data', 'favourite.json');

module.exports = class Favourite {

  static _readData(callback) {
    fs.readFile(FavouriteDataPath, (err, data) => {
      if (err || !data || data.length === 0) {
        return callback({});
      }
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // migrate legacy array to object under "default"
          return callback({ "default": parsed });
        }
        return callback(parsed || {});
      } catch (e) {
        return callback({});
      }
    });
  }

  static _writeData(data, callback) {
    fs.writeFile(FavouriteDataPath, JSON.stringify(data, null, 2), callback);
  }

  static addToFavourite(homeId, userId, callback) {
    // If only 2 arguments passed (legacy addToFavourite(homeId, callback))
    if (typeof userId === 'function') {
      callback = userId;
      userId = 'default';
    }
    userId = userId || 'default';

    Favourite._readData((favMap) => {
      if (!favMap[userId]) {
        favMap[userId] = [];
      }
      if (!favMap[userId].includes(homeId)) {
        favMap[userId].push(homeId);
        Favourite._writeData(favMap, (err) => {
          if (callback) callback(null, true);
        });
      } else {
        if (callback) callback("Home already in favourites", false);
      }
    });
  }

  static getFavourites(userId, callback) {
    if (typeof userId === 'function') {
      callback = userId;
      userId = 'default';
    }
    userId = userId || 'default';

    Favourite._readData((favMap) => {
      const userFavs = favMap[userId] || [];
      if (callback) callback(userFavs);
    });
  }

  static deleteById(delHomeId, userId, callback) {
    if (typeof userId === 'function') {
      callback = userId;
      userId = 'default';
    }
    userId = userId || 'default';

    Favourite._readData((favMap) => {
      if (favMap[userId]) {
        favMap[userId] = favMap[userId].filter(id => id !== delHomeId);
      }
      // Also remove across all users if called during home deletion
      if (userId === 'all') {
        for (const u in favMap) {
          favMap[u] = favMap[u].filter(id => id !== delHomeId);
        }
      }
      Favourite._writeData(favMap, callback);
    });
  }

  static toggleFavourite(homeId, userId, callback) {
    userId = userId || 'default';
    Favourite._readData((favMap) => {
      if (!favMap[userId]) {
        favMap[userId] = [];
      }
      const index = favMap[userId].indexOf(homeId);
      let isFav = false;
      if (index >= 0) {
        favMap[userId].splice(index, 1);
        isFav = false;
      } else {
        favMap[userId].push(homeId);
        isFav = true;
      }
      Favourite._writeData(favMap, (err) => {
        if (callback) callback(err, isFav);
      });
    });
  }
};
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const rootDir = require('../utils/pathUtil');

const userDataPath = path.join(rootDir, 'data', 'users.json');

module.exports = class User {
  constructor(firstName, lastName, email, password, userType = 'guest', id = null) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.userType = userType; // 'guest' or 'host'
    this.id = id || Math.random().toString(36).substring(2, 9);
    this.createdAt = new Date().toISOString();
  }

  save(callback) {
    User.fetchAll((users) => {
      // Hash password before saving if it's not already hashed
      if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
        const salt = bcrypt.genSaltSync(10);
        this.password = bcrypt.hashSync(this.password, salt);
      }

      const existingIndex = users.findIndex(u => u.id === this.id || u.email.toLowerCase() === this.email.toLowerCase());
      if (existingIndex >= 0) {
        users[existingIndex] = this;
      } else {
        users.push(this);
      }

      fs.writeFile(userDataPath, JSON.stringify(users, null, 2), (err) => {
        if (err) console.error("Error saving user:", err);
        if (callback) callback(err, this);
      });
    });
  }

  static fetchAll(callback) {
    fs.readFile(userDataPath, (err, data) => {
      if (!err && data && data.length > 0) {
        try {
          callback(JSON.parse(data));
        } catch (e) {
          callback([]);
        }
      } else {
        callback([]);
      }
    });
  }

  static findByEmail(email, callback) {
    if (!email) return callback(null);
    User.fetchAll((users) => {
      const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      callback(user || null);
    });
  }

  static findById(id, callback) {
    if (!id) return callback(null);
    User.fetchAll((users) => {
      const user = users.find(u => u.id === id);
      callback(user || null);
    });
  }

  static verifyPassword(plainPassword, hashedPassword) {
    try {
      return bcrypt.compareSync(plainPassword, hashedPassword);
    } catch (e) {
      return false;
    }
  }
};

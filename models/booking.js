const fs = require('fs');
const path = require('path');
const rootDir = require('../utils/pathUtil');

const bookingDataPath = path.join(rootDir, 'data', 'bookings.json');

module.exports = class Booking {
  constructor(userId, userName, userEmail, homeId, homeName, homePhoto, location, pricePerNight, checkIn, checkOut, nights, guests, totalPrice) {
    this.id = 'book-' + Math.random().toString(36).substring(2, 9);
    this.userId = userId;
    this.userName = userName;
    this.userEmail = userEmail;
    this.homeId = homeId;
    this.homeName = homeName;
    this.homePhoto = homePhoto;
    this.location = location;
    this.pricePerNight = pricePerNight;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.nights = nights;
    this.guests = guests;
    this.totalPrice = totalPrice;
    this.status = 'Confirmed';
    this.createdAt = new Date().toISOString();
  }

  save(callback) {
    Booking.fetchAll((bookings) => {
      bookings.push(this);
      fs.writeFile(bookingDataPath, JSON.stringify(bookings, null, 2), (err) => {
        if (err) console.error("Error saving booking:", err);
        if (callback) callback(err, this);
      });
    });
  }

  static fetchAll(callback) {
    fs.readFile(bookingDataPath, (err, data) => {
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

  static fetchByUserId(userId, callback) {
    Booking.fetchAll((bookings) => {
      const userBookings = bookings.filter(b => b.userId === userId);
      callback(userBookings.reverse());
    });
  }

  static cancelBooking(bookingId, userId, callback) {
    Booking.fetchAll((bookings) => {
      const updatedBookings = bookings.map(b => {
        if (b.id === bookingId && b.userId === userId) {
          return { ...b, status: 'Cancelled' };
        }
        return b;
      });
      fs.writeFile(bookingDataPath, JSON.stringify(updatedBookings, null, 2), (err) => {
        if (callback) callback(err);
      });
    });
  }

  static deleteById(bookingId, userId, callback) {
    Booking.fetchAll((bookings) => {
      const filtered = bookings.filter(b => !(b.id === bookingId && b.userId === userId));
      fs.writeFile(bookingDataPath, JSON.stringify(filtered, null, 2), (err) => {
        if (callback) callback(err);
      });
    });
  }
};

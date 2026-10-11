const fs = require('fs');
const path = require('path');
const rootDir = require('../utils/pathUtil');
const Favourite = require('./favourite');

const homeDataPath = path.join(rootDir, 'data', 'homes.json');

module.exports = class Home {
  constructor(
    houseName,
    price,
    location,
    rating = 4.85,
    photoUrl,
    description = '',
    category = 'Beachfront',
    amenities = [],
    hostId = null,
    hostName = 'Sarah Jenkins',
    maxGuests = 4,
    bedrooms = 2,
    beds = 2,
    bathrooms = 1,
    additionalPhotos = [],
    reviews = []
  ) {
    this.houseName = houseName ? houseName.trim() : '';
    this.price = price ? price.toString().trim() : '0';
    this.location = location ? location.trim() : '';
    this.rating = rating || 4.85;
    this.photoUrl = photoUrl ? photoUrl.trim() : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800';
    this.description = description ? description.trim() : 'A lovely stay with breathtaking views, modern amenities, and cozy ambiance.';
    this.category = category || 'Beachfront';
    this.amenities = Array.isArray(amenities) ? amenities : (amenities ? [amenities] : ['Wifi', 'Kitchen', 'Free parking']);
    this.hostId = hostId || 'user-host-1';
    this.hostName = hostName || 'Sarah Jenkins';
    this.maxGuests = Number(maxGuests) || 4;
    this.bedrooms = Number(bedrooms) || 2;
    this.beds = Number(beds) || 2;
    this.bathrooms = Number(bathrooms) || 1;
    this.additionalPhotos = Array.isArray(additionalPhotos) && additionalPhotos.length > 0 ? additionalPhotos : [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
    ];
    this.reviews = Array.isArray(reviews) ? reviews : [];
  }

  save(callback) {
    Home.fetchAll((registeredHomes) => {
      if (this.id) { // Edit home case
        const existingIndex = registeredHomes.findIndex(h => h.id === this.id);
        if (existingIndex >= 0) {
          // Preserve reviews and created properties if not updated
          const existing = registeredHomes[existingIndex];
          this.reviews = this.reviews && this.reviews.length > 0 ? this.reviews : (existing.reviews || []);
          this.hostId = this.hostId || existing.hostId || 'user-host-1';
          this.hostName = this.hostName || existing.hostName || 'Sarah Jenkins';
          registeredHomes[existingIndex] = this;
        } else {
          registeredHomes.push(this);
        }
      } else { // Add home case
        this.id = 'home-' + Math.random().toString(36).substring(2, 9);
        registeredHomes.push(this);
      }

      fs.writeFile(homeDataPath, JSON.stringify(registeredHomes, null, 2), error => {
        if (error) console.error("Error writing homes.json:", error);
        if (callback) callback(error, this);
      });
    });
  }

  static fetchAll(callback) {
    fs.readFile(homeDataPath, (err, data) => {
      if (!err && data && data.length > 0) {
        try {
          const homes = JSON.parse(data);
          callback(Array.isArray(homes) ? homes : []);
        } catch (e) {
          callback([]);
        }
      } else {
        callback([]);
      }
    });
  }

  static findById(homeId, callback) {
    this.fetchAll(homes => {
      const homeFound = homes.find(home => home.id === homeId);
      callback(homeFound || null);
    });
  }

  static fetchByHostId(hostId, callback) {
    this.fetchAll(homes => {
      // If legacy home without hostId, allow demo host or match hostId
      const hostHomes = homes.filter(h => h.hostId === hostId || (!h.hostId && hostId === 'user-host-1'));
      callback(hostHomes);
    });
  }

  static deleteById(homeId, callback) {
    this.fetchAll(homes => {
      const filteredHomes = homes.filter(home => home.id !== homeId);
      fs.writeFile(homeDataPath, JSON.stringify(filteredHomes, null, 2), error => {
        Favourite.deleteById(homeId, 'all', () => {
          if (callback) callback(error);
        });
      });
    });
  }

  static addReview(homeId, review, callback) {
    this.fetchAll(homes => {
      const home = homes.find(h => h.id === homeId);
      if (!home) return callback && callback("Home not found");

      if (!home.reviews) home.reviews = [];
      review.id = 'rev-' + Math.random().toString(36).substring(2, 7);
      review.date = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      home.reviews.unshift(review);

      // Re-calculate average rating
      const sum = home.reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
      home.rating = (sum / home.reviews.length).toFixed(2);

      fs.writeFile(homeDataPath, JSON.stringify(homes, null, 2), err => {
        if (callback) callback(err, home);
      });
    });
  }
};
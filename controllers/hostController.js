const Home = require('../models/home');

exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: 'Add Home · Airbnb Host',
    currentPage: "add-home",
    editing: false,
    home: null,
    errorMessage: null
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === 'true';

  Home.findById(homeId, home => {
    if (!home) {
      req.session.flashError = "Listing not found.";
      return res.redirect("/host/host-home-list");
    }

    // Authorization check: Only listing owner can edit
    const currentUserId = req.session.user ? req.session.user.id : null;
    if (home.hostId && home.hostId !== currentUserId) {
      req.session.flashError = "Access denied: You can only edit your own listings.";
      return res.redirect("/host/host-home-list");
    }

    res.render("host/edit-home", {
      home: home,
      pageTitle: `Edit ${home.houseName} · Airbnb`,
      currentPage: "host-homes",
      editing: editing,
      errorMessage: null
    });
  });
};

exports.getHostHomes = (req, res, next) => {
  const hostId = req.session.user ? req.session.user.id : null;

  Home.fetchByHostId(hostId, (hostHomes) => {
    const successMessage = req.session.flashSuccess || null;
    const errorMessage = req.session.flashError || null;
    req.session.flashSuccess = null;
    req.session.flashError = null;

    res.render("host/host-home-list", {
      registeredHomes: hostHomes,
      pageTitle: 'Manage Your Listings · Airbnb Host',
      currentPage: "host-homes",
      successMessage: successMessage,
      errorMessage: errorMessage
    });
  });
};

exports.postAddHome = (req, res, next) => {
  const {
    houseName,
    price,
    location,
    rating,
    photoUrl,
    description,
    category,
    amenities,
    maxGuests,
    bedrooms,
    beds,
    bathrooms,
    additionalPhotos
  } = req.body;

  const currentUser = req.session.user;
  const hostId = currentUser ? currentUser.id : 'user-host-1';
  const hostName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Sarah Jenkins';

  // Process amenities: checkboxes come as string or array
  let processedAmenities = [];
  if (Array.isArray(amenities)) {
    processedAmenities = amenities;
  } else if (typeof amenities === 'string' && amenities.trim().length > 0) {
    processedAmenities = amenities.split(',').map(a => a.trim());
  }

  // Process additional photos
  let processedPhotos = [];
  if (typeof additionalPhotos === 'string' && additionalPhotos.trim().length > 0) {
    processedPhotos = additionalPhotos.split(',').map(p => p.trim()).filter(p => p.length > 0);
  }

  const home = new Home(
    houseName,
    price,
    location,
    parseFloat(rating) || 4.90,
    photoUrl,
    description,
    category || 'Beachfront',
    processedAmenities,
    hostId,
    hostName,
    maxGuests || 4,
    bedrooms || 2,
    beds || 2,
    bathrooms || 1,
    processedPhotos
  );

  home.save((err) => {
    if (err) {
      req.session.flashError = "Failed to create listing. Please try again.";
    } else {
      req.session.flashSuccess = "Your listing is now live on Airbnb!";
    }
    res.redirect("/host/host-home-list");
  });
};

exports.postEditHome = (req, res, next) => {
  const {
    id,
    houseName,
    price,
    location,
    rating,
    photoUrl,
    description,
    category,
    amenities,
    maxGuests,
    bedrooms,
    beds,
    bathrooms,
    additionalPhotos
  } = req.body;

  Home.findById(id, existingHome => {
    if (!existingHome) {
      req.session.flashError = "Listing not found.";
      return res.redirect("/host/host-home-list");
    }

    // Authorization check
    const currentUserId = req.session.user ? req.session.user.id : null;
    if (existingHome.hostId && existingHome.hostId !== currentUserId) {
      req.session.flashError = "Access denied: You cannot edit another host's listing.";
      return res.redirect("/host/host-home-list");
    }

    let processedAmenities = [];
    if (Array.isArray(amenities)) {
      processedAmenities = amenities;
    } else if (typeof amenities === 'string' && amenities.trim().length > 0) {
      processedAmenities = amenities.split(',').map(a => a.trim());
    } else {
      processedAmenities = existingHome.amenities || [];
    }

    let processedPhotos = existingHome.additionalPhotos || [];
    if (typeof additionalPhotos === 'string' && additionalPhotos.trim().length > 0) {
      processedPhotos = additionalPhotos.split(',').map(p => p.trim()).filter(p => p.length > 0);
    }

    const home = new Home(
      houseName,
      price,
      location,
      parseFloat(rating) || existingHome.rating,
      photoUrl,
      description,
      category || existingHome.category,
      processedAmenities,
      existingHome.hostId,
      existingHome.hostName,
      maxGuests || existingHome.maxGuests,
      bedrooms || existingHome.bedrooms,
      beds || existingHome.beds,
      bathrooms || existingHome.bathrooms,
      processedPhotos,
      existingHome.reviews || []
    );

    home.id = id;
    home.save((err) => {
      if (err) {
        req.session.flashError = "Failed to update listing.";
      } else {
        req.session.flashSuccess = "Listing updated successfully!";
      }
      res.redirect("/host/host-home-list");
    });
  });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findById(homeId, existingHome => {
    if (!existingHome) {
      return res.redirect("/host/host-home-list");
    }

    // Authorization check
    const currentUserId = req.session.user ? req.session.user.id : null;
    if (existingHome.hostId && existingHome.hostId !== currentUserId) {
      req.session.flashError = "Access denied: You cannot delete another host's listing.";
      return res.redirect("/host/host-home-list");
    }

    Home.deleteById(homeId, error => {
      if (error) {
        req.session.flashError = "Failed to delete listing.";
      } else {
        req.session.flashSuccess = "Listing was removed.";
      }
      res.redirect("/host/host-home-list");
    });
  });
};
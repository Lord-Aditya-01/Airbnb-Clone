const Favourite = require('../models/favourite');
const Home = require('../models/home');
const Booking = require('../models/booking');

const ALL_CATEGORIES = [
  { name: 'All', icon: 'fa-globe' },
  { name: 'Beachfront', icon: 'fa-umbrella-beach' },
  { name: 'Cabins', icon: 'fa-mountain' },
  { name: 'Mansions', icon: 'fa-landmark' },
  { name: 'Lakefront', icon: 'fa-water' },
  { name: 'Iconic cities', icon: 'fa-city' },
  { name: 'Countryside', icon: 'fa-tree' },
  { name: 'Trending', icon: 'fa-fire' },
  { name: 'Tiny homes', icon: 'fa-campground' }
];

exports.getIndex = (req, res, next) => {
  const selectedCategory = req.query.category || 'All';
  const searchQuery = req.query.search ? req.query.search.trim().toLowerCase() : '';
  const currentUserId = req.session.user ? req.session.user.id : 'default';

  Home.fetchAll((registeredHomes) => {
    let filtered = registeredHomes;

    // Filter by Category
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(h => h.category && h.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by Search Query (matching house name or location)
    if (searchQuery) {
      filtered = filtered.filter(h => 
        (h.houseName && h.houseName.toLowerCase().includes(searchQuery)) ||
        (h.location && h.location.toLowerCase().includes(searchQuery))
      );
    }

    // Fetch user favorites
    Favourite.getFavourites(currentUserId, (userFavIds) => {
      const successMessage = req.session.flashSuccess || null;
      const errorMessage = req.session.flashError || null;
      req.session.flashSuccess = null;
      req.session.flashError = null;

      res.render("store/index", {
        registeredHomes: filtered,
        pageTitle: 'Airbnb · Vacation rentals, cabins, beach houses & more',
        currentPage: "Index",
        categories: ALL_CATEGORIES,
        selectedCategory: selectedCategory,
        searchQuery: req.query.search || '',
        userFavIds: userFavIds || [],
        successMessage: successMessage,
        errorMessage: errorMessage
      });
    });
  });
};

exports.getHomes = (req, res, next) => {
  const selectedCategory = req.query.category || 'All';
  const searchQuery = req.query.search ? req.query.search.trim().toLowerCase() : '';
  const currentUserId = req.session.user ? req.session.user.id : 'default';

  Home.fetchAll((registeredHomes) => {
    let filtered = registeredHomes;

    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(h => h.category && h.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery) {
      filtered = filtered.filter(h => 
        (h.houseName && h.houseName.toLowerCase().includes(searchQuery)) ||
        (h.location && h.location.toLowerCase().includes(searchQuery))
      );
    }

    Favourite.getFavourites(currentUserId, (userFavIds) => {
      res.render("store/home-list", {
        registeredHomes: filtered,
        pageTitle: 'Explore Homes · Airbnb',
        currentPage: "Home",
        categories: ALL_CATEGORIES,
        selectedCategory: selectedCategory,
        searchQuery: req.query.search || '',
        userFavIds: userFavIds || []
      });
    });
  });
};

exports.getHomesDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  const currentUserId = req.session.user ? req.session.user.id : 'default';

  Home.findById(homeId, home => {
    if (!home) {
      req.session.flashError = "Stay not found.";
      return res.redirect("/homes");
    }

    Favourite.getFavourites(currentUserId, (userFavIds) => {
      const isFav = userFavIds.includes(home.id);
      const successMessage = req.session.flashSuccess || null;
      const errorMessage = req.session.flashError || null;
      req.session.flashSuccess = null;
      req.session.flashError = null;

      res.render("store/home-details", {
        home: home,
        pageTitle: `${home.houseName} · Airbnb`,
        currentPage: "Home",
        isFavourite: isFav,
        successMessage: successMessage,
        errorMessage: errorMessage
      });
    });
  });
};

exports.postAddReview = (req, res, next) => {
  const homeId = req.params.homeId;
  const { rating, comment } = req.body;
  const currentUser = req.session.user;

  if (!currentUser) {
    req.session.flashError = "Please log in to submit a review.";
    return res.redirect(`/homes/${homeId}`);
  }

  if (!comment || comment.trim().length === 0) {
    req.session.flashError = "Please enter a comment for your review.";
    return res.redirect(`/homes/${homeId}`);
  }

  const review = {
    userName: `${currentUser.firstName} ${currentUser.lastName}`,
    rating: parseFloat(rating) || 5,
    comment: comment.trim()
  };

  Home.addReview(homeId, review, (err) => {
    if (err) {
      req.session.flashError = "Could not submit review.";
    } else {
      req.session.flashSuccess = "Thank you! Your review has been published.";
    }
    res.redirect(`/homes/${homeId}`);
  });
};

exports.getBookings = (req, res, next) => {
  const currentUserId = req.session.user ? req.session.user.id : null;
  if (!currentUserId) {
    return res.redirect('/login');
  }

  Booking.fetchByUserId(currentUserId, (bookings) => {
    const successMessage = req.session.flashSuccess || null;
    const errorMessage = req.session.flashError || null;
    req.session.flashSuccess = null;
    req.session.flashError = null;

    res.render("store/bookings", {
      bookings: bookings,
      pageTitle: 'My Trips & Bookings · Airbnb',
      currentPage: "bookings",
      successMessage: successMessage,
      errorMessage: errorMessage
    });
  });
};

exports.postCreateBooking = (req, res, next) => {
  const homeId = req.params.homeId;
  const { checkIn, checkOut, guests } = req.body;
  const currentUser = req.session.user;

  if (!currentUser) {
    req.session.returnTo = `/homes/${homeId}`;
    req.session.flashError = "Please log in to book this property.";
    return res.redirect('/login');
  }

  if (!checkIn || !checkOut) {
    req.session.flashError = "Please select both check-in and check-out dates.";
    return res.redirect(`/homes/${homeId}`);
  }

  const date1 = new Date(checkIn);
  const date2 = new Date(checkOut);
  const diffTime = date2 - date1;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    req.session.flashError = "Check-out date must be after check-in date.";
    return res.redirect(`/homes/${homeId}`);
  }

  Home.findById(homeId, home => {
    if (!home) {
      req.session.flashError = "Selected stay does not exist.";
      return res.redirect('/homes');
    }

    const pricePerNight = parseFloat(home.price) || 1000;
    const baseTotal = pricePerNight * diffDays;
    const cleaningFee = Math.round(baseTotal * 0.05);
    const serviceFee = Math.round(baseTotal * 0.08);
    const grandTotal = baseTotal + cleaningFee + serviceFee;

    const booking = new Booking(
      currentUser.id,
      `${currentUser.firstName} ${currentUser.lastName}`,
      currentUser.email,
      home.id,
      home.houseName,
      home.photoUrl,
      home.location,
      pricePerNight,
      checkIn,
      checkOut,
      diffDays,
      Number(guests) || 1,
      grandTotal
    );

    booking.save((err) => {
      if (err) {
        req.session.flashError = "Booking could not be confirmed. Please try again.";
        return res.redirect(`/homes/${homeId}`);
      }
      req.session.flashSuccess = `Reservation confirmed for ${home.houseName}! Have a wonderful stay!`;
      res.redirect("/bookings");
    });
  });
};

exports.postCancelBooking = (req, res, next) => {
  const bookingId = req.params.bookingId;
  const currentUserId = req.session.user ? req.session.user.id : null;

  if (!currentUserId) {
    return res.redirect('/login');
  }

  Booking.cancelBooking(bookingId, currentUserId, (err) => {
    if (err) {
      req.session.flashError = "Could not cancel booking.";
    } else {
      req.session.flashSuccess = "Your reservation has been cancelled.";
    }
    res.redirect("/bookings");
  });
};

exports.getFavouriteList = (req, res, next) => {
  const currentUserId = req.session.user ? req.session.user.id : 'default';

  Favourite.getFavourites(currentUserId, favourites => {
    Home.fetchAll((registeredHomes) => {
      const favouriteHomes = registeredHomes.filter(home => favourites.includes(home.id));
      const successMessage = req.session.flashSuccess || null;
      req.session.flashSuccess = null;

      res.render("store/favourite-list", {
        favouriteHomes: favouriteHomes,
        pageTitle: 'Wishlists & Favourites · Airbnb',
        currentPage: "Favourites",
        userFavIds: favourites,
        successMessage: successMessage
      });
    });
  });
};

exports.postAddToFavourite = (req, res, next) => {
  const homeId = req.body.id;
  const currentUserId = req.session.user ? req.session.user.id : 'default';

  Favourite.toggleFavourite(homeId, currentUserId, (err, isFav) => {
    const returnUrl = req.header('Referer') || '/favourites';
    res.redirect(returnUrl);
  });
};

exports.postRemoveFromFavourite = (req, res, next) => {
  const homeId = req.params.homeId;
  const currentUserId = req.session.user ? req.session.user.id : 'default';

  Favourite.deleteById(homeId, currentUserId, error => {
    res.redirect("/favourites");
  });
};

const express = require('express');
const storeRouter = express.Router();
const storeController = require("../controllers/storeController");
const isAuth = require("../middleware/isAuth");

// Public browsing routes
storeRouter.get("/", storeController.getIndex);
storeRouter.get("/homes", storeController.getHomes);
storeRouter.get("/homes/:homeId", storeController.getHomesDetails);

// Favourites / Wishlists
storeRouter.get("/favourites", storeController.getFavouriteList);
storeRouter.post("/favourites", storeController.postAddToFavourite);
storeRouter.post("/favourites/delete/:homeId", storeController.postRemoveFromFavourite);

// Protected routes (Authentication required)
storeRouter.post("/homes/:homeId/review", isAuth, storeController.postAddReview);
storeRouter.get("/bookings", isAuth, storeController.getBookings);
storeRouter.post("/book/:homeId", isAuth, storeController.postCreateBooking);
storeRouter.post("/bookings/cancel/:bookingId", isAuth, storeController.postCancelBooking);

module.exports = storeRouter;
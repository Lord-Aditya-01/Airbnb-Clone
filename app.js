// Core Module
const path = require('path');

// External Module
const express = require('express');
const session = require('express-session');

// Local Modules
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorControllers = require("./controllers/errors");

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

// Body Parser Middleware
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(session({
  secret: 'airbnb_secret_super_secure_key_123!@#',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Global Context Middleware for all templates
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn || false;
  res.locals.currentUser = req.session.user || null;
  res.locals.isHost = req.session.user ? (req.session.user.userType === 'host') : false;
  res.locals.currentPath = req.path;
  next();
});

// Static Assets
app.use(express.static(path.join(rootDir, 'public')));

// Application Routes
app.use(authRouter);
app.use(storeRouter);
app.use("/host", hostRouter);

// 404 Handler
app.use(errorControllers.error404);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on address http://localhost:${PORT}`);
});
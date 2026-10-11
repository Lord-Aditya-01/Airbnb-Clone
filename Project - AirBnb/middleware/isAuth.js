module.exports = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    req.session.returnTo = req.originalUrl;
    req.session.flashError = "Please log in to continue.";
    return res.redirect('/login');
  }
  next();
};

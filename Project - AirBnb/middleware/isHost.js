module.exports = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    req.session.returnTo = req.originalUrl;
    req.session.flashError = "Please log in as a host to access this section.";
    return res.redirect('/login');
  }

  if (req.session.user && req.session.user.userType === 'host') {
    return next();
  }

  // If user is guest, notify them and redirect
  req.session.flashError = "Host privileges required. Please switch or sign up as a Host.";
  return res.redirect('/become-host');
};

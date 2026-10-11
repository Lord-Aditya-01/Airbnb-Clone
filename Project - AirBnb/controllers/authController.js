const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return res.redirect('/');
  }
  const errorMessage = req.session.flashError || null;
  const successMessage = req.session.flashSuccess || null;
  req.session.flashError = null;
  req.session.flashSuccess = null;

  res.render('auth/login', {
    pageTitle: 'Log in or Sign up · Airbnb',
    currentPage: 'login',
    errorMessage: errorMessage,
    successMessage: successMessage,
    oldInput: { email: '' }
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/login', {
      pageTitle: 'Log in or Sign up · Airbnb',
      currentPage: 'login',
      errorMessage: 'Please enter both email and password.',
      successMessage: null,
      oldInput: { email }
    });
  }

  User.findByEmail(email, (user) => {
    if (!user) {
      return res.render('auth/login', {
        pageTitle: 'Log in or Sign up · Airbnb',
        currentPage: 'login',
        errorMessage: 'Invalid email address or password.',
        successMessage: null,
        oldInput: { email }
      });
    }

    const isMatch = User.verifyPassword(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', {
        pageTitle: 'Log in or Sign up · Airbnb',
        currentPage: 'login',
        errorMessage: 'Invalid email address or password.',
        successMessage: null,
        oldInput: { email }
      });
    }

    // Login successful
    req.session.isLoggedIn = true;
    req.session.user = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType
    };

    req.session.flashSuccess = `Welcome back, ${user.firstName}!`;
    const returnUrl = req.session.returnTo || '/';
    delete req.session.returnTo;

    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      res.redirect(returnUrl);
    });
  });
};

exports.getSignup = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return res.redirect('/');
  }
  const errorMessage = req.session.flashError || null;
  req.session.flashError = null;

  res.render('auth/signup', {
    pageTitle: 'Sign up · Airbnb',
    currentPage: 'signup',
    errorMessage: errorMessage,
    oldInput: { firstName: '', lastName: '', email: '', userType: 'guest' }
  });
};

exports.postSignup = (req, res, next) => {
  const { firstName, lastName, email, password, confirmPassword, userType } = req.body;

  // Validation
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return res.render('auth/signup', {
      pageTitle: 'Sign up · Airbnb',
      currentPage: 'signup',
      errorMessage: 'Please fill out all required fields.',
      oldInput: { firstName, lastName, email, userType }
    });
  }

  if (password.length < 6) {
    return res.render('auth/signup', {
      pageTitle: 'Sign up · Airbnb',
      currentPage: 'signup',
      errorMessage: 'Password must be at least 6 characters long.',
      oldInput: { firstName, lastName, email, userType }
    });
  }

  if (password !== confirmPassword) {
    return res.render('auth/signup', {
      pageTitle: 'Sign up · Airbnb',
      currentPage: 'signup',
      errorMessage: 'Passwords do not match.',
      oldInput: { firstName, lastName, email, userType }
    });
  }

  User.findByEmail(email, (existingUser) => {
    if (existingUser) {
      return res.render('auth/signup', {
        pageTitle: 'Sign up · Airbnb',
        currentPage: 'signup',
        errorMessage: 'An account with this email already exists. Please log in.',
        oldInput: { firstName, lastName, email, userType }
      });
    }

    const newUser = new User(firstName, lastName, email, password, userType || 'guest');
    newUser.save((err, savedUser) => {
      if (err) {
        return res.render('auth/signup', {
          pageTitle: 'Sign up · Airbnb',
          currentPage: 'signup',
          errorMessage: 'An error occurred while creating your account. Please try again.',
          oldInput: { firstName, lastName, email, userType }
        });
      }

      // Auto login after sign up
      req.session.isLoggedIn = true;
      req.session.user = {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        userType: savedUser.userType
      };
      req.session.flashSuccess = `Welcome to Airbnb, ${savedUser.firstName}! Your account has been created.`;

      req.session.save((saveErr) => {
        if (savedUser.userType === 'host') {
          return res.redirect('/host/add-home');
        }
        res.redirect('/');
      });
    });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.redirect('/');
  });
};

exports.getBecomeHost = (req, res, next) => {
  const errorMessage = req.session.flashError || null;
  req.session.flashError = null;

  res.render('store/become-host', {
    pageTitle: 'Airbnb your home · Host on Airbnb',
    currentPage: 'become-host',
    errorMessage: errorMessage
  });
};

exports.postBecomeHost = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    req.session.returnTo = '/become-host';
    req.session.flashError = "Please log in to register as a Host.";
    return res.redirect('/login');
  }

  User.findById(req.session.user.id, (user) => {
    if (!user) {
      return res.redirect('/login');
    }

    user.userType = 'host';
    const userInstance = new User(user.firstName, user.lastName, user.email, user.password, 'host', user.id);
    userInstance.save((err) => {
      req.session.user.userType = 'host';
      req.session.flashSuccess = "Congratulations! You are now an Airbnb Host. You can now publish listings.";
      req.session.save(() => {
        res.redirect('/host/add-home');
      });
    });
  });
};

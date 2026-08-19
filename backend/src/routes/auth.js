const express = require('express');
const { passport } = require('../saml/passport');
const { createSession, destroySession } = require('../auth/session');
const config = require('../config');

const router = express.Router();

router.get('/login', (req, res, next) => {
  req.session.loginFlow = 'sp-initiated';
  passport.authenticate('saml', {
    session: false
  })(req, res, next);
});

router.get('/idp-initiated', (req, res) => {
  // This route intentionally starts at the IdP. The browser leaves our
  // application and enters Auth0's SAML IdP login URL.
  res.redirect(config.saml.entryPoint);
});

router.get('/logout', async (req, res, next) => {
  try {
    await destroySession(req);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

module.exports = router;

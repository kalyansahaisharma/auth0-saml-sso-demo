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

router.post(
  '/acs',
  passport.authenticate('saml', {
    session: false,
    failureRedirect: '/?saml_error=1'
  }),
  (req, res) => {
    const flow = req.session.loginFlow || 'idp-initiated';

    createSession(req, req.user);

    // Remove the marker so a later unsolicited response is identified as
    // IdP-initiated.
    delete req.session.loginFlow;

    res.redirect(`/?flow=${encodeURIComponent(flow)}`);
  }
);

router.get('/logout', async (req, res, next) => {
  try {
    await destroySession(req);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

module.exports = router;

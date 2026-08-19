const express = require('express');
const { createSession } = require('../auth/session');
const { passport, samlStrategy } = require('../saml/passport');

const router = express.Router();

router.get('/metadata', (req, res, next) => {
  try {
    const metadata = samlStrategy.generateServiceProviderMetadata();
    res.type('application/xml').send(metadata);
  } catch (error) {
    next(error);
  }
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

module.exports = router;

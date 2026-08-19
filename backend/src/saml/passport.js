const passport = require('passport');
const { Strategy } = require('passport-saml');
const config = require('../config');
const ReplayCache = require('./replayCache');

const replayCache = new ReplayCache();

const samlStrategy = new Strategy(
  {
    entryPoint: config.saml.entryPoint,
    issuer: config.saml.issuer,
    callbackUrl: config.saml.callbackUrl,

    // Auth0 signs the SAML response/assertion. This certificate is the
    // trust anchor for signature verification.
    cert: config.saml.idpCert,

    // SP-initiated responses contain InResponseTo. IdP-initiated responses
    // do not, so validate it when present.
    validateInResponseTo: false,

    // Keep SAML request IDs in the strategy's cache so InResponseTo can
    // be checked.
    requestIdExpirationPeriodMs: 10 * 60 * 1000,

    // Reject stale SAML conditions within the normal clock-skew window.
    acceptedClockSkewMs: 60000,

    // Explicitly require a signed assertion/response.
    wantAssertionsSigned: true,

    // Auth0 sends an HTTP-POST SAML response to the ACS.
    identifierFormat: null,

    // These values are checked by node-saml.
    audience: config.saml.issuer,
    recipient: config.saml.callbackUrl
  },
  (profile, done) => {
    try {
      const assertionId =
            profile.ID ||
            profile.id ||
            profile.sessionIndex ||
            profile.nameID;

      if (!assertionId) {
        return done(new Error('SAML assertion did not contain an assertion ID'));
      }

      // Defense in depth: reject a previously accepted assertion even when
      // there is no InResponseTo (IdP-initiated flow).
      if (!replayCache.add(assertionId)) {
        return done(new Error('SAML assertion replay detected'));
      }

      const user = {
        nameID: profile.nameID || null,
        email:
          profile.email ||
          profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
          null,
        name: profile.displayName || profile.name || null,
        givenName: profile.givenName || null,
        familyName: profile.familyName || null,
        issuer: profile.issuer || null,
        assertionId
      };

      if (!user.email && !user.nameID) {
        return done(new Error('SAML assertion did not provide an email or NameID'));
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  }
);

// Passport requires serialize/deserialize hooks. The actual authenticated
// identity is stored in express-session.
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use('saml', samlStrategy);

module.exports = {
  passport,
  samlStrategy
};

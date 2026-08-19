const express = require('express');
const { samlStrategy } = require('../saml/passport');

const router = express.Router();

router.get('/metadata', (req, res, next) => {
  try {
    const metadata = samlStrategy.generateServiceProviderMetadata();
    res.type('application/xml').send(metadata);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

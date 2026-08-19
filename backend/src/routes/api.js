const express = require('express');
const { requireSession } = require('../auth/session');

const router = express.Router();

router.get('/me', requireSession, (req, res) => {
  res.json({
    authenticated: true,
    flow: req.session.lastFlow || null,
    user: req.session.user
  });
});

module.exports = router;

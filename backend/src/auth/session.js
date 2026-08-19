function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      authenticated: false,
      error: 'Authentication required'
    });
  }

  next();
}

function createSession(req, user) {
  // Session data is deliberately small and contains only the identity
  // needed by the demo.
  req.session.user = user;
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

module.exports = {
  requireSession,
  createSession,
  destroySession
};

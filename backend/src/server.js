const path = require('path');
const express = require('express');
const session = require('express-session');
const { passport } = require('./saml/passport');
const config = require('./config');

const authRoutes = require('./routes/auth');
const samlRoutes = require('./routes/saml');
const apiRoutes = require('./routes/api');

const app = express();

app.disable('x-powered-by');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    name: 'saml_demo.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());

app.use('/auth', authRoutes);
app.use('/saml', samlRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.static(path.resolve(__dirname, '../../frontend')));

app.use((error, req, res, next) => {
  console.error('[error]', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).send(`
    <h1>SAML error</h1>
    <pre>${escapeHtml(error.message || 'Unknown error')}</pre>
    <p><a href="/">Back to demo</a></p>
  `);
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

app.listen(config.port, () => {
  console.log(`Auth0 SAML demo listening on ${config.baseUrl}`);
});

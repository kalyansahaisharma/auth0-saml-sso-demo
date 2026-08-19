const path = require('path');
const fs = require('fs');
require('dotenv').config();

const port = Number(process.env.PORT || 3000);
const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');

const required = [
  'SAML_ISSUER',
  'SAML_ENTRY_POINT',
  'SAML_IDP_CERT_PATH',
  'SESSION_SECRET'
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const certificatePath = path.resolve(__dirname, '..', process.env.SAML_IDP_CERT_PATH);
if (!fs.existsSync(certificatePath)) {
  throw new Error(
    `SAML IdP certificate not found at ${certificatePath}. ` +
    `Download Auth0's signing certificate and save it there.`
  );
}

module.exports = {
  port,
  baseUrl,
  saml: {
    issuer: process.env.SAML_ISSUER,
    entryPoint: process.env.SAML_ENTRY_POINT,
    idpCert: fs.readFileSync(certificatePath, 'utf8'),
    callbackUrl: `${baseUrl}/saml/acs`,
    metadataUrl: `${baseUrl}/saml/metadata`
  },
  sessionSecret: process.env.SESSION_SECRET
};

# Auth0 SAML 2.0 SSO Demo

A minimal but production-shaped demo where **Auth0 is the SAML Identity Provider (IdP)** and this Node.js application is the **SAML Service Provider (SP)**.

It supports:

- SP-initiated SAML login
- IdP-initiated SAML login
- SAML SP metadata
- SAML ACS endpoint
- Signature validation through `passport-saml` / `node-saml`
- Audience and recipient validation
- `InResponseTo` validation when present
- In-memory assertion-ID replay protection
- In-memory server-side sessions
- A minimal frontend showing the authenticated identity
- `.env.example` with no secrets committed

## Architecture

```text
SP-initiated

Browser
  |
  | GET /auth/login
  v
Node.js SAML SP
  |
  | AuthnRequest
  v
Auth0 SAML IdP
  |
  | SAMLResponse (HTTP-POST)
  v
POST /saml/acs
  |
  | validate signature, audience, recipient,
  | time conditions, InResponseTo when present,
  | assertion replay
  v
Node session
  |
  v
Frontend: Logged in as ...


IdP-initiated

Browser
  |
  | Auth0 SAML2 Web App "Identity Provider Login URL"
  v
Auth0 SAML IdP
  |
  | SAMLResponse (no AuthnRequest)
  v
POST /saml/acs
  |
  | validate signature, audience, recipient,
  | time conditions, assertion replay
  v
Node session
  |
  v
Frontend: Logged in as ...
```

## Important security note

IdP-initiated SSO is intentionally supported because the ticket requires it. Auth0 documents that unsolicited IdP-initiated SSO has weaker CSRF properties than SP-initiated SSO. Prefer SP-initiated SSO whenever the product can control the entry point.

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- A free Auth0 developer tenant
- A test user in the Auth0 tenant
- A browser

## 1. Install

From the `backend` directory:

```bash
npm install
```

## 2. Create the environment file

Copy:

```text
backend/.env.example
```

to:

```text
backend/.env
```

Example:

```env
PORT=3000
BASE_URL=http://localhost:3000

SAML_ISSUER=http://localhost:3000/saml/metadata
SAML_ENTRY_POINT=https://YOUR_TENANT.auth0.com/samlp/YOUR_CLIENT_ID
SAML_IDP_CERT_PATH=./config/auth0-idp-cert.pem

SESSION_SECRET=replace-with-a-long-random-demo-secret
```

`SAML_ENTRY_POINT` is the **Identity Provider Login URL** shown by Auth0 under:

**Applications → Applications → your SAML application → Addons → SAML2 Web App → Usage**

Do not commit the `.env` file or the Auth0 certificate.

## 3. Configure Auth0 as the SAML IdP

### 3.1 Create a free Auth0 tenant

Create or use a development tenant. Do not use production credentials or real customer data.

### 3.2 Create a test user

In Auth0:

**User Management → Users → Create User**

Use a test email such as:

```text
saml.demo@example.com
```

Use a password you control for the demo.

### 3.3 Create the Auth0 application

Go to:

**Applications → Applications → Create Application**

Choose:

- Name: `SAML Demo IdP`
- Application type: `Regular Web Application`

Save it.

### 3.4 Enable SAML2 Web App

Open the application:

**Addons → SAML2 Web App → Enable**

Set:

**Application Callback URL**

```text
http://localhost:3000/saml/acs
```

Then put this JSON in the Settings box:

```json
{
  "audience": "http://localhost:3000/saml/metadata",
  "recipient": "http://localhost:3000/saml/acs",
  "destination": "http://localhost:3000/saml/acs",
  "mappings": {
    "email": "email",
    "name": "name",
    "given_name": "given_name",
    "family_name": "family_name"
  }
}
```

The important contract is:

- `audience` = our SP Entity ID
- `recipient` = our ACS URL
- `destination` = our ACS URL

Save/enable the addon.

### 3.5 Download Auth0's signing certificate

From the Auth0 application, open the SAML addon / certificate area and download the signing certificate in PEM format.

Save it as:

```text
backend/config/auth0-idp-cert.pem
```

Do not commit it if your organization treats certificates as deployment secrets. For this demo it is public verification material, but keeping it outside source control makes the configuration cleaner.

### 3.6 Copy the Identity Provider Login URL

From:

**Applications → Applications → SAML Demo IdP → Addons → SAML2 Web App → Usage**

copy:

```text
Identity Provider Login URL
```

It will look similar to:

```text
https://YOUR_TENANT.auth0.com/samlp/YOUR_CLIENT_ID
```

Put it in `.env` as:

```env
SAML_ENTRY_POINT=...
```

## 4. Attribute mapping

This demo uses:

| Application claim | SAML attribute |
|---|---|
| email | email |
| name | name |
| given_name | given_name |
| family_name | family_name |

The application displays the email and name.

For persistence, the recommended long-term identifier is an immutable IdP subject/NameID rather than using an email address as the database primary key. Email can change. See `DECISIONS.md`.

## 5. Run the backend

From `backend`:

```bash
npm start
```

You should see:

```text
SAML demo listening on http://localhost:3000
```

Open:

```text
http://localhost:3000
```

## 6. Test SP-initiated login

1. Open `http://localhost:3000`
2. Click **SP-initiated login**
3. Browser redirects to Auth0
4. Sign in with the Auth0 test user
5. Auth0 posts a SAML response to:
   `POST http://localhost:3000/saml/acs`
6. Node validates the SAML response
7. Node creates the demo session
8. Browser is redirected to `/`
9. The page shows:
   - Login flow: SP-initiated
   - Logged in as: test email
   - Name
   - NameID
   - Issuer
   - Assertion ID

## 7. Test IdP-initiated login

There are two ways.

### Method A — use the demo UI

On the home page, click:

**IdP-initiated login**

The browser opens Auth0's **Identity Provider Login URL**. If you are not already logged into Auth0, Auth0 will ask you to authenticate. Auth0 then sends an unsolicited SAML response directly to this application's ACS endpoint.

The UI labels the result:

```text
Login flow: IdP-initiated
```

### Method B — test from Auth0

Use the **Identity Provider Login URL** from:

**Applications → SAML Demo IdP → Addons → SAML2 Web App → Usage**

This is the cleanest way to demonstrate that the login starts at the IdP rather than at the SP.

## 8. Test metadata

Open:

```text
http://localhost:3000/saml/metadata
```

The XML should contain:

- SP Entity ID
- Assertion Consumer Service URL
- HTTP-POST binding

The Entity ID is:

```text
http://localhost:3000/saml/metadata
```

## 9. Test current identity

After login:

```text
GET http://localhost:3000/api/me
```

It returns JSON similar to:

```json
{
  "authenticated": true,
  "flow": "sp-initiated",
  "user": {
    "nameID": "auth0|...",
    "email": "saml.demo@example.com",
    "name": "SAML Demo User",
    "givenName": "SAML",
    "familyName": "Demo",
    "issuer": "https://YOUR_TENANT.auth0.com/",
    "assertionId": "_..."
  }
}
```

Without a session it returns HTTP 401.

## 10. Test logout

Click **Logout**, or:

```text
GET http://localhost:3000/logout
```

This clears the local demo session. It does not implement full SAML Single Logout because SLO was not required by the ticket.

## 11. What is actually validated

The SAML library is responsible for cryptographic and protocol validation. The application additionally tracks consumed assertion IDs.

### Signature

The Auth0 X.509 certificate is configured as the trusted IdP signing certificate. The library validates the XML signature.

### Audience

The application expects:

```text
http://localhost:3000/saml/metadata
```

Auth0's SAML addon must use the same value as its `audience`.

### Recipient

The application expects:

```text
http://localhost:3000/saml/acs
```

### Destination

The response is expected to target:

```text
http://localhost:3000/saml/acs
```

### InResponseTo

For SP-initiated responses, the SAML library records the generated request ID and validates the returned `InResponseTo`.

For IdP-initiated responses, there is no original AuthnRequest, so `InResponseTo` is absent. The configuration uses `validateInResponseTo: "false"`.

### Assertion replay

The application keeps recently accepted assertion IDs in an in-memory replay cache. Reusing the same assertion ID is rejected.

This cache is intentionally small and in-memory for the assignment. A multi-instance production deployment should use a shared cache such as Redis.

## 12. Troubleshooting

### "Invalid signature"

Check that:

- the certificate belongs to the Auth0 tenant/application signing certificate
- the PEM file is correct
- the certificate path in `.env` is correct

### "Invalid audience"

Auth0 SAML addon:

```json
"audience": "http://localhost:3000/saml/metadata"
```

must match the SP issuer/entity ID.

### "Invalid recipient"

Auth0 SAML addon:

```json
"recipient": "http://localhost:3000/saml/acs"
```

must match the ACS URL.

### Auth0 does not return to the app

Check:

```text
Application Callback URL
```

is exactly:

```text
http://localhost:3000/saml/acs
```

Also make sure the SAML addon is enabled.

### IdP-initiated login does not work

Verify the Auth0 SAML addon is configured for SAML response delivery and that the **Identity Provider Login URL** is being used.

For Auth0's IdP-initiated configuration, the application must be configured as the target/default application and the response protocol must be SAML when the target application expects a SAML response.

### Session disappears after restart

Expected. The assignment explicitly allows an in-memory session.

## 13. Production follow-up

This demo intentionally does not implement:

- persistent user provisioning
- Redis-backed sessions/replay cache
- HTTPS termination
- SAML Single Logout
- key rotation automation
- centralized audit logging
- multiple SP instances
- CSRF hardening for the IdP-initiated login UX

Those are appropriate production follow-ups, not required for this assignment.

## 14. Useful endpoints

| Endpoint | Purpose |
|---|---|
| `/` | Demo UI |
| `/auth/login` | SP-initiated login |
| `/saml/acs` | SAML Assertion Consumer Service |
| `/saml/metadata` | SP metadata |
| `/api/me` | Session-protected identity endpoint |
| `/auth/idp-initiated` | Opens Auth0 IdP-initiated entry point |
| `/logout` | Local demo logout |
| `/health` | Health check |

## 15. Git hygiene

The repository contains:

```text
.env.example
```

but not:

```text
.env
```

The `.gitignore` also excludes:

```text
.env
```

Before committing:

```bash
git status
```

Confirm that `.env` is not listed.

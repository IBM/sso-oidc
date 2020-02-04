# sso-oidc

> Utility to instrument Single Sign-on (SSO) for Node.js and Express.

This project illustrates the basic client/server login flow for Single Page Applications (SPA) using Single Sign-in (SSO) with OpenID Connect (oidc).

The `sso-oidc` module is intended to be used with [Express.js](https://github.com/expressjs/express) with [cookie-session](https://github.com/expressjs/cookie-session) and [body-parser](https://github.com/expressjs/body-parser) middleware. The client implementation is framework agnostic.

## Getting started

### Server-side

```bash
yarn add sso-oidc body-parser cookie-session
```

It is recommended to read environment secrets using [dotenv](https://github.com/motdotla/dotenv) or a similar module.

```bash
yarn add dotenv
```

```js
// server.js
import { json } from 'body-parser';
import session from 'cookie-session';
import express from 'express';
import Strategy from 'sso-oidc';

const app = express()
  .use(json())
  .use(
    session({
      maxAge: 1 * 60 * 1000, // 60 seconds
      name: 'sso-oidc',
      secret: '<SESSION_SECRET>'
    })
  );

const sso = new Strategy({
  redirectUri: '',
  redirectUriLocal: '',
  clientId: '',
  clientSecret: '',
  issuerId: '',
  tokenUrl: '',
  authUrl: '',
  introspectUrl: ''
});

// Returns the silent authorization url.
app.get('/authUrl', sso.getSilentAuthUrl);

// Checks if the current session is valid.
app.get('/check', sso.check);

// Authenticates user using the temporary code returned from silent authorization.
app.post('/callback', sso.token, sso.introspect, (req, res) => {
  res.send({ user_idd: req.session.user_id });
});

// Uses a wildcard to authenticate POST requests for a common, protected route.
app.post('/api/*', sso.protect);

// Resets `access_token`, `user_id` but persists session.
app.post('/api/logout', sso.destroy, ({}, res) => res.send({ success: true }));
```

### Client-side

Refer to the [`create-react-app` example](examples/create-react-app) for a basic client login flow using React hooks.

## License

[Apache 2.0](LICENSE)

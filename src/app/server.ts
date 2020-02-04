import { json } from 'body-parser';
import session from 'cookie-session';
import { config } from 'dotenv';
import express from 'express';
import Strategy from '../Strategy';

config();

const PORT: number = parseInt(process.env.PORT!, 10) || 8080;

const app = express()
  .use(json())
  .use(
    session({
      maxAge: 24 * 60 * 60 * 1000, // 120 seconds
      secret: process.env.CLIENT_ID
    })
  );

const sso = new Strategy({
  redirectUri: process.env.REDIRECT_URI!,
  redirectUriLocal: process.env.REDIRECT_URI_LOCAL!,
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  issuerId: process.env.ISSUER_ID!,
  tokenUrl: process.env.TOKEN_URL!,
  authUrl: process.env.AUTH_URL!,
  introspectUrl: process.env.INTROSPECT_URL!
});

app.get('/authUrl', ({}, res) => {
  res.send({ url: sso.silentAuthUrl });
});

app.post('/code', sso.token, sso.introspect, (req, res) => {
  res.send({ user_id: req.session?.user_id });
});

app.get('/check', sso.check);

app.post('/callback', sso.token, sso.introspect, (req, res) => {
  res.send({ user_id: req.session!.user_id });
});

app.get('/api/*', sso.protect);

app.get('/api/logout', sso.destroy, ({}, res) => {
  res.send({});
});

app.listen(PORT, () => {
  process.stdout.write(`Listening on port ${PORT}\n`);
});

import { NextFunction, Request, Response } from 'express';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

interface ISso {
  access_token?: string;
  user_id?: string;
}

declare global {
  namespace Express {
    // tslint:disable-next-line: interface-name
    export interface Request {
      session?: ISso;
    }
  }
}

interface ISsoOptions {
  redirectUri: string;
  redirectUriLocal?: string;
  clientId: string;
  clientSecret: string;
  issuerId: string;
  tokenUrl: string;
  authUrl: string;
  introspectUrl: string;
}

interface IConfig extends ISsoOptions {
  silentAuthUrl: string;
}

class Strategy {
  private config: IConfig;
  private http = fetch;

  constructor(options: ISsoOptions) {
    this.config = {
      ...options,
      silentAuthUrl: `${options.authUrl}?client_id=${options.clientId}&scope=openid&redirect_uri=${options.redirectUri}&response_type=code`
    };
  }

  public get silentAuthUrl() {
    return this.config.silentAuthUrl;
  }

  public check = (req: Request, res: Response, {}) => {
    res.send({ valid: this.authenticated(req) });
  };

  public protect = (req: Request, res: Response, next: NextFunction) => {
    if (this.authenticated(req)) {
      return next();
    }

    res.status(401).send({ error: 'Unauthorized user' });
  };

  public token = async (req: Request, {}, next: NextFunction) => {
    const body = new URLSearchParams();
    const { clientId, clientSecret, redirectUri, tokenUrl } = this.config;

    body.append('grant_type', 'authorization_code');
    body.append('client_id', clientId);
    body.append('client_secret', clientSecret);
    body.append('redirect_uri', redirectUri);
    body.append('code', req.body.code);

    const response = await this.http(tokenUrl, { method: 'POST', body });
    const data: { access_token: string } = await response.json();

    req.session!.access_token = data.access_token;
    next();
  };

  public introspect = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session!.access_token === undefined) {
      return res.status(401).send({
        error: {
          message: 'Invalid access_token',
          description: 'An access_token is required to invoke the introspection endpooint'
        }
      });
    }

    const body = new URLSearchParams();
    const { clientId, clientSecret, introspectUrl } = this.config;

    body.append('client_id', clientId);
    body.append('client_secret', clientSecret);
    body.append('token', req.session!.access_token!);

    const response = await this.http(introspectUrl, { method: 'POST', body });
    const data: { sub: string } = await response.json();

    req.session!.user_id = data.sub;
    next();
  };

  public destroy(req: Request, {}, next: NextFunction) {
    req.session!.access_token = undefined;
    req.session!.user_id = undefined;
    next();
  }

  private authenticated(req: Request) {
    return req.session && req.session.user_id !== undefined;
  }
}

export default Strategy;

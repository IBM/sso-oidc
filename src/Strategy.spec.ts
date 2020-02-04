import { Request, Response, NextFunction } from 'express';
import Strategy from './Strategy';
import fetch from 'node-fetch';
// tslint:disable: no-object-literal-type-assertion

let sso: Strategy;

describe('Strategy', () => {
  beforeAll(() => {
    sso = new Strategy({
      redirectUri: 'redirectUri',
      redirectUriLocal: 'redirectUriLocal',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
      issuerId: 'issuerId',
      tokenUrl: 'tokenUrl',
      authUrl: 'authUrl',
      introspectUrl: 'introspectUrl'
    });
  });

  test('get silentAuthUrl', () => {
    expect(sso.silentAuthUrl).toEqual(
      'authUrl?client_id=clientId&scope=openid&redirect_uri=redirectUri&response_type=code'
    );
  });

  test('check', () => {
    const req = { session: { access_token: undefined, user_id: undefined } } as Request;
    const res = {} as Response;
    res.send = jest.fn().mockReturnValue(res);
    const next: NextFunction = jest.fn();

    sso.check(req, res, next);
    expect(res.send).toBeCalledWith({ valid: false });
    req.session!.user_id = 'user_id';
    sso.check(req, res, next);
    expect(res.send).toBeCalledWith({ valid: true });
  });

  test('protect', () => {
    const req = { session: { access_token: undefined, user_id: undefined } } as Request;
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    const next: NextFunction = jest.fn();

    sso.protect(req, res, next);
    expect(res.status).toBeCalledWith(401);
    expect(res.send).toBeCalledWith({ error: 'Unauthorized user' });

    req.session!.user_id = 'user_id';
    sso.protect(req, res, next);
    expect(next).toBeCalled();
  });

  test('token', async () => {
    // @ts-ignore
    sso.http = jest.fn().mockImplementation(
      () =>
        new Promise(resolve => {
          resolve({ json: () => ({ access_token: 'access_token' }) });
        })
    ) as typeof fetch;
    const req = {
      body: { code: 'code' },
      session: { access_token: undefined, user_id: undefined }
    } as Request;
    const res = {} as Response;
    const next: NextFunction = jest.fn();

    await sso.token(req, res, next);
    expect(req.session!.access_token).toEqual('access_token');
    expect(next).toBeCalled();
  });

  test('introspect', async () => {
    // @ts-ignore
    sso.http = jest.fn().mockImplementation(
      () =>
        new Promise(resolve => {
          resolve({ json: () => ({ sub: 'user_id' }) });
        })
    ) as typeof fetch;
    const req = {
      body: { code: 'code' },
      session: { access_token: 'access_token', user_id: undefined }
    } as Request;
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    const next: NextFunction = jest.fn();

    await sso.introspect(req, res, next);
    expect(req.session!.user_id).toEqual('user_id');
    expect(next).toBeCalled();

    req.session!.access_token = undefined;

    await sso.introspect(req, res, next);
    expect(res.status).toBeCalledWith(401);
    expect(res.send).toBeCalledWith({
      error: {
        message: 'Invalid access_token',
        description: 'An access_token is required to invoke the introspection endpooint'
      }
    });
  });

  test('destroy', () => {
    const req = { session: { access_token: 'access_token', user_id: 'user_id' } } as Request;
    const res = {} as Response;
    const next: NextFunction = jest.fn();

    sso.destroy(req, res, next);
    expect(req.session!.access_token).toEqual(undefined);
    expect(req.session!.user_id).toEqual(undefined);
  });
});

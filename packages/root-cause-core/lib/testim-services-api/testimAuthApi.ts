import nodeFetch, { Headers } from 'node-fetch';
import { decode as jwtDecode } from 'jsonwebtoken';
import { TestimApiError } from './apiErrors';
import type { AbortSignal } from 'abort-controller';

type ServerTokenState = {
  serverToken: string;
  serverTokenExpiryMilliseconds: number;
  refreshToken: string;
  ngrokTunnelToken: string;
  projectId: string;
};
const FIVE_MIN_IN_MS = 5 * 60 * 1000;

/**
 * Stateful wrapper around authenticating against the Testim Services API with a CI token
 * Mostly copied from the runner code
 */
export class TestimAuthApi {
  tokenState?: ServerTokenState;

  constructor(
    private baseUrl: string = 'https://services.testim.io',
    private fetch: typeof nodeFetch = nodeFetch
  ) {
    this.getToken = (ensureOnlyOneRequestAtATime(
      this.getToken.bind(this)
    ) as unknown) as typeof TestimAuthApi.prototype.getToken;
  }

  public async getToken(projectId: string, ciToken: string, signal?: AbortSignal) {
    return this.obtainTokenFromCiTokenIfNeeded(projectId, ciToken, signal);
  }
  public async isAuthenticated(signal?: AbortSignal) {
    const headers = new Headers();
    this.addAuthorizationHeader(headers);
    const alive = await this.fetch(`${this.baseUrl}/auth/check/${this.tokenState?.projectId}`, {
      headers: headers as any, // TODO(benji) remove this cast once changes in node-fetch#741 land
      signal: signal as any,
    });
    return alive.ok;
  }
  public addAuthorizationHeader(headers: Headers) {
    if (!this.tokenState?.serverToken || !headers) {
      throw new TypeError(
        'Attempted to add authorizaiton header without authorizing first or without headers'
      );
    }
    headers.set('Authorization', `Bearer ${this.tokenState?.serverToken}`);
  }
  private async obtainTokenFromCiTokenIfNeeded(
    projectId: string,
    token: string,
    signal?: AbortSignal
  ) {
    if (!this.tokenState?.serverTokenExpiryMilliseconds) {
      return this.obtainTokenFromCiToken(projectId, token, signal);
    }
    if (token !== this.tokenState?.projectId) {
      return this.obtainTokenFromCiToken(projectId, token, signal);
    }
    const hasTokenExpired =
      this.tokenState?.serverTokenExpiryMilliseconds > Date.now() + FIVE_MIN_IN_MS;
    if (hasTokenExpired) {
      try {
        return this.refreshTokenFromObtainedToken(signal);
      } catch (e) {
        return this.obtainTokenFromCiToken(projectId, token, signal);
      }
    }
    return this.tokenState.serverToken;
  }
  private async refreshTokenFromObtainedToken(signal?: AbortSignal) {
    if (!this.tokenState) {
      throw new TypeError('Error, attempted to refresh a non-existing token');
    }
    const response: any = await this.fetch(`${this.baseUrl}/auth/refreshToken`, {
      method: 'POST',
      body: JSON.stringify({
        token: this.tokenState?.serverToken,
        refreshToken: this.tokenState?.refreshToken,
      }),
      headers: {
        'content-type': 'application/json',
      },
      signal: signal as any,
    });
    this.tokenState.serverToken = response.token;
    this.tokenState.serverTokenExpiryMilliseconds = (jwtDecode(response.token) as any).exp * 1000;
    return this.tokenState.serverToken;
  }
  private async obtainTokenFromCiToken(projectId: string, token: string, signal?: AbortSignal) {
    let customTokenResponse: any;
    const throwUnauthorizedError = (e: Error) => {
      throw new TestimApiError(
        e,
        `Error trying to retrieve CLI token. Your CLI token and project might not match. `,
        'E_CREDENTIALS_DONT_MATCH'
      );
    };
    try {
      customTokenResponse = await this.fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        signal: signal as any,
        body: JSON.stringify({ projectId, token }),
      }).then((x) => x.json());
    } catch (e) {
      if (e.message.includes('Unauthorized')) {
        throwUnauthorizedError(e);
      }
      throw new TestimApiError(e, e.message, 'E_UNAUTHENTICATED');
    }
    if (customTokenResponse?.status === 'error') {
      if (customTokenResponse?.code === 'unauthorized') {
        throwUnauthorizedError(customTokenResponse.code);
      }
    }
    const serverToken: string = customTokenResponse.token;
    this.tokenState = {
      serverToken,
      serverTokenExpiryMilliseconds: (jwtDecode(serverToken) as any).exp * 1000,
      refreshToken: customTokenResponse.refreshToken,
      ngrokTunnelToken: customTokenResponse.ngrokToken,
      projectId,
    };
    return this.tokenState.serverToken;
  }
}

function ensureOnlyOneRequestAtATime(fn: (...any: any[]) => Promise<any>): unknown {
  let inFlight: any = null;
  return function (this: any, ...args: any[]): any {
    if (inFlight) {
      return inFlight;
    }
    inFlight = fn.call(this, ...args);
    Promise.resolve(inFlight).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}

import { catalogueURL, record, text, validateCatalogueURL } from './metadata';
import { nebulaVideoURL } from './urls';

const LOGIN = 'https://users.api.nebula.app/api/v1/auth/login/';
const AUTHORIZE = 'https://users.api.nebula.app/api/v1/authorization/';
const LOGOUT = 'https://users.api.nebula.app/api/v1/auth/logout/';
export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 0,
    public readonly retryMs = 60_000,
  ) {
    super(code);
  }
}
export interface Session {
  key?: string;
  token?: string;
  generation: string;
}
export interface SessionPort {
  read(): Promise<Session>;
  write(value: Session): Promise<void>;
}

export class NebulaClient {
  private renewal?: Promise<string>;
  constructor(
    private readonly session: SessionPort,
    private readonly fetcher: typeof fetch = (...args) => globalThis.fetch(...args),
  ) {}

  private async request(
    url: string,
    {
      key,
      token,
      body,
      method = 'GET',
    }: {
      key?: string;
      token?: string;
      body?: { email: string; password: string };
      method?: string;
    } = {},
  ): Promise<unknown> {
    // Destinations are constructed internally; no public method accepts arbitrary URLs.
    if (
      (body && url !== LOGIN) ||
      (key && ![AUTHORIZE, LOGOUT].includes(url)) ||
      (token && !url.startsWith('https://content.api.nebula.app/'))
    )
      throw new ServiceError('destination-denied');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (key) headers.Authorization = `Token ${key}`;
    if (token) headers.Authorization = `Bearer ${token}`;
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        redirect: 'error',
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      throw new ServiceError(
        error instanceof DOMException && ['AbortError', 'TimeoutError'].includes(error.name)
          ? 'request-timeout'
          : 'offline-or-network',
      );
    }
    if (response.redirected || (response.status >= 300 && response.status < 400))
      throw new ServiceError('redirect-denied');
    if (!response.ok) {
      const value = response.headers.get('retry-after');
      const seconds =
        value && /^\d+$/.test(value)
          ? Number(value)
          : value
            ? (Date.parse(value) - Date.now()) / 1000
            : 60;
      const retryMs = Number.isFinite(seconds)
        ? Math.min(86400000, Math.max(60_000, seconds * 1000))
        : 60_000;
      throw new ServiceError(
        (
          {
            401: 'sign-in-required',
            403: 'access-denied',
            404: 'metadata-unavailable',
            429: 'rate-limited',
          } as Record<number, string>
        )[response.status] ?? 'service-unavailable',
        response.status,
        retryMs,
      );
    }
    if (response.status === 204) return {};
    try {
      return await response.json();
    } catch {
      throw new ServiceError('invalid-response');
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const generation = crypto.randomUUID();
    await this.session.write({ generation });
    const key = text(
      record(await this.request(LOGIN, { body: { email, password }, method: 'POST' })).key,
      4096,
    );
    const token = text(record(await this.request(AUTHORIZE, { key, method: 'POST' })).token, 8192);
    if ((await this.session.read()).generation !== generation) {
      await this.request(LOGOUT, { key, method: 'POST' }).catch(() => {});
      throw new ServiceError('sign-in-cancelled');
    }
    await this.session.write({ generation, key, token });
  }

  async logout(): Promise<boolean> {
    const previous = await this.session.read();
    await this.session.write({ generation: crypto.randomUUID() });
    if (!previous.key) return true;
    try {
      await this.request(LOGOUT, { key: previous.key, method: 'POST' });
      return true;
    } catch {
      return false;
    } // Local logout always succeeds, including when offline.
  }

  async signedIn(): Promise<boolean> {
    return Boolean((await this.session.read()).key);
  }

  private async renew(): Promise<string> {
    if (this.renewal) return this.renewal;
    this.renewal = (async () => {
      const previous = await this.session.read();
      if (!previous.key) throw new ServiceError('sign-in-required', 401);
      let token: string;
      try {
        token = text(
          record(await this.request(AUTHORIZE, { key: previous.key, method: 'POST' })).token,
          8192,
        );
      } catch (error) {
        if (
          error instanceof ServiceError &&
          [401, 403].includes(error.status) &&
          (await this.session.read()).generation === previous.generation
        ) {
          await this.session.write({ generation: crypto.randomUUID() });
        }
        throw error;
      }
      if ((await this.session.read()).generation !== previous.generation)
        throw new ServiceError('sign-in-required', 401);
      await this.session.write({ ...previous, token });
      return token;
    })();
    try {
      return await this.renewal;
    } finally {
      this.renewal = undefined;
    }
  }

  async catalogue(slug: string, nextURL?: string): Promise<unknown> {
    const destination = nextURL ? validateCatalogueURL(nextURL, slug) : catalogueURL(slug);
    return this.content(destination);
  }

  async episode(slug: string): Promise<unknown> {
    nebulaVideoURL(slug);
    return this.content(`https://content.api.nebula.app/video_episodes/${slug}/`);
  }

  private async content(destination: string): Promise<unknown> {
    const previous = await this.session.read();
    // Public metadata works without signing in. A signed-in session renews once
    // when the observed API returns 401 or 403; continued failure stays explicit.
    try {
      return await this.request(destination, { token: previous.token });
    } catch (error) {
      if (!(error instanceof ServiceError) || ![401, 403].includes(error.status) || !previous.key)
        throw error;
      return this.request(destination, { token: await this.renew() });
    }
  }
}

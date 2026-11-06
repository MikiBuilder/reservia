import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  loginRequest,
  parseSessionUser,
  registerRequest,
  safeRedirectPath,
  toSessionUser,
} from '../src/lib/auth';

const apiUser = {
  id: 'user-1',
  email: 'marta@example.com',
  name: 'Marta Ferrer',
  status: 'ACTIVE',
  role: 'CUSTOMER',
  createdAt: '2026-10-11T17:27:39.716Z',
};

function stubFetch(options: {
  ok: boolean;
  status: number;
  body?: unknown;
}) {
  const fetchMock = vi.fn(async () => ({
    ok: options.ok,
    status: options.status,
    json: async () => options.body,
  }));

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('toSessionUser', () => {
  it('keeps only the fields used by the session', () => {
    expect(toSessionUser(apiUser)).toEqual({
      id: 'user-1',
      email: 'marta@example.com',
      name: 'Marta Ferrer',
      role: 'CUSTOMER',
    });
  });
});

describe('parseSessionUser', () => {
  it('parses a stored session user', () => {
    expect(
      parseSessionUser(
        JSON.stringify({
          id: 'user-1',
          email: 'marta@example.com',
          name: 'Marta Ferrer',
          role: 'CUSTOMER',
        }),
      ),
    ).toEqual({
      id: 'user-1',
      email: 'marta@example.com',
      name: 'Marta Ferrer',
      role: 'CUSTOMER',
    });
  });

  it('returns null when the value is missing or invalid', () => {
    expect(parseSessionUser(undefined)).toBeNull();
    expect(parseSessionUser('no-es-json')).toBeNull();
  });
});

describe('safeRedirectPath', () => {
  it('accepts internal paths', () => {
    expect(
      safeRedirectPath('/resources/1?date=2026-08-31'),
    ).toBe('/resources/1?date=2026-08-31');
    expect(safeRedirectPath('/')).toBe('/');
  });

  it('rejects external and malformed targets', () => {
    expect(
      safeRedirectPath('https://evil.example.com'),
    ).toBeNull();
    expect(safeRedirectPath('//evil.example.com')).toBeNull();
    expect(safeRedirectPath('javascript:alert(1)')).toBeNull();
    expect(safeRedirectPath(undefined)).toBeNull();
  });
});

describe('loginRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the token and the session user', async () => {
    const fetchMock = stubFetch({
      ok: true,
      status: 200,
      body: {
        data: {
          accessToken: 'token-1',
          user: apiUser,
        },
      },
    });

    const outcome = await loginRequest(
      'marta@example.com',
      'Sala-Mediterranea-2026',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'marta@example.com',
          password: 'Sala-Mediterranea-2026',
        }),
        cache: 'no-store',
      },
    );
    expect(outcome).toEqual({
      ok: true,
      accessToken: 'token-1',
      user: {
        id: 'user-1',
        email: 'marta@example.com',
        name: 'Marta Ferrer',
        role: 'CUSTOMER',
      },
    });
  });

  it('maps 401 to invalid credentials', async () => {
    stubFetch({ ok: false, status: 401 });

    await expect(
      loginRequest('marta@example.com', 'otra-cosa'),
    ).resolves.toEqual({
      ok: false,
      error: 'credentials',
    });
  });

  it('maps 403 to an inactive account', async () => {
    stubFetch({ ok: false, status: 403 });

    await expect(
      loginRequest(
        'marta@example.com',
        'Sala-Mediterranea-2026',
      ),
    ).resolves.toEqual({
      ok: false,
      error: 'inactive',
    });
  });

  it('throws on unexpected failures', async () => {
    stubFetch({ ok: false, status: 503 });

    await expect(
      loginRequest(
        'marta@example.com',
        'Sala-Mediterranea-2026',
      ),
    ).rejects.toThrow(
      'Login request failed with status 503',
    );
  });
});

describe('registerRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns ok on success', async () => {
    stubFetch({
      ok: true,
      status: 201,
      body: { data: apiUser },
    });

    await expect(
      registerRequest({
        email: 'marta@example.com',
        password: 'Sala-Mediterranea-2026',
        name: 'Marta Ferrer',
      }),
    ).resolves.toEqual({ ok: true });
  });

  it('maps 409 to an existing email', async () => {
    stubFetch({ ok: false, status: 409 });

    await expect(
      registerRequest({
        email: 'marta@example.com',
        password: 'Sala-Mediterranea-2026',
        name: 'Marta Ferrer',
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'email-taken',
    });
  });

  it('maps 400 to an invalid payload', async () => {
    stubFetch({ ok: false, status: 400 });

    await expect(
      registerRequest({
        email: 'no-es-un-email',
        password: 'corta',
        name: '',
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'invalid',
    });
  });
});
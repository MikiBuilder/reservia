import { apiUrl } from './api-url';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export type LoginOutcome =
  | {
      ok: true;
      accessToken: string;
      user: SessionUser;
    }
  | {
      ok: false;
      error: 'credentials' | 'inactive';
    };

export type RegisterOutcome =
  | { ok: true }
  | {
      ok: false;
      error: 'email-taken' | 'invalid';
    };

interface ApiUser {
  id: string;
  email: string;
  name: string;
  status: string;
  role: string;
  createdAt: string;
}

export function toSessionUser(user: ApiUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function parseSessionUser(
  raw: string | undefined,
): SessionUser | null {
  if (raw === undefined) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function safeRedirectPath(
  value: unknown,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginOutcome> {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  if (response.status === 401) {
    return { ok: false, error: 'credentials' };
  }

  if (response.status === 403) {
    return { ok: false, error: 'inactive' };
  }

  if (!response.ok) {
    throw new Error(
      `Login request failed with status ${response.status}`,
    );
  }

  const body = (await response.json()) as {
    data: {
      accessToken: string;
      user: ApiUser;
    };
  };

  return {
    ok: true,
    accessToken: body.data.accessToken,
    user: toSessionUser(body.data.user),
  };
}

export async function registerRequest(params: {
  email: string;
  password: string;
  name: string;
}): Promise<RegisterOutcome> {
  const response = await fetch(
    apiUrl('/api/auth/register'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    },
  );

  if (response.status === 409) {
    return { ok: false, error: 'email-taken' };
  }

  if (response.status === 400) {
    return { ok: false, error: 'invalid' };
  }

  if (!response.ok) {
    throw new Error(
      `Register request failed with status ${response.status}`,
    );
  }

  return { ok: true };
}
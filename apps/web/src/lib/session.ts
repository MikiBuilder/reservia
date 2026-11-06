import { cookies } from 'next/headers';

import { parseSessionUser, SessionUser } from './auth';

const ACCESS_TOKEN_COOKIE = 'reservia_access_token';
const SESSION_USER_COOKIE = 'reservia_session_user';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export interface Session {
  token: string;
  user: SessionUser;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const rawUser = cookieStore.get(SESSION_USER_COOKIE)?.value;

  if (token === undefined) {
    return null;
  }

  const user = parseSessionUser(rawUser);

  if (user === null) {
    return null;
  }

  return { token, user };
}

export async function setSession(
  token: string,
  user: SessionUser,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 15,
  });

  cookieStore.set(
    SESSION_USER_COOKIE,
    JSON.stringify(user),
    {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 15,
    },
  );
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(SESSION_USER_COOKIE);
}
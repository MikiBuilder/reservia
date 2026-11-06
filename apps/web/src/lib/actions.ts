'use server';

import { redirect } from 'next/navigation';

import {
  loginRequest,
  registerRequest,
  safeRedirectPath,
} from './auth';
import { createBooking } from './bookings';
import {
  clearSession,
  getSession,
  setSession,
} from './session';

function withParams(
  path: string,
  params: Record<string, string>,
): string {
  const search = new URLSearchParams(params).toString();

  return `${path}${path.includes('?') ? '&' : '?'}${search}`;
}

export async function login(
  formData: FormData,
): Promise<void> {
  const email = formData.get('email');
  const password = formData.get('password');
  const next = safeRedirectPath(formData.get('next')) ?? '/';

  if (
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    redirect(withParams('/login', { error: 'invalid', next }));
  }

  const outcome = await loginRequest(email, password);

  if (!outcome.ok) {
    redirect(
      withParams('/login', { error: outcome.error, next }),
    );
  }

  await setSession(outcome.accessToken, outcome.user);

  redirect(next);
}

export async function register(
  formData: FormData,
): Promise<void> {
  const email = formData.get('email');
  const password = formData.get('password');
  const name = formData.get('name');
  const next = safeRedirectPath(formData.get('next')) ?? '/';

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof name !== 'string'
  ) {
    redirect(
      withParams('/register', { error: 'invalid', next }),
    );
  }

  const outcome = await registerRequest({
    email,
    password,
    name,
  });

  if (!outcome.ok) {
    redirect(
      withParams('/register', { error: outcome.error, next }),
    );
  }

  const loginOutcome = await loginRequest(email, password);

  if (!loginOutcome.ok) {
    redirect(
      withParams('/login', {
        error: loginOutcome.error,
        next,
      }),
    );
  }

  await setSession(
    loginOutcome.accessToken,
    loginOutcome.user,
  );

  redirect(next);
}

export async function logout(): Promise<void> {
  await clearSession();

  redirect('/');
}

export async function bookSlot(
  formData: FormData,
): Promise<void> {
  const resourceId = formData.get('resourceId');
  const date = formData.get('date');
  const bookingId = formData.get('bookingId');
  const startsAt = formData.get('startsAt');
  const endsAt = formData.get('endsAt');
  const idempotencyKey = formData.get('idempotencyKey');

  const resourcePath =
    typeof resourceId === 'string' && resourceId !== ''
      ? `/resources/${resourceId}`
      : '/';

  const backPath =
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? withParams(resourcePath, { date })
      : resourcePath;

  const session = await getSession();

  if (session === null) {
    redirect(
      withParams('/login', {
        error: 'login-required',
        next: backPath,
      }),
    );
  }

  if (
    typeof bookingId !== 'string' ||
    typeof startsAt !== 'string' ||
    typeof endsAt !== 'string' ||
    typeof idempotencyKey !== 'string' ||
    typeof resourceId !== 'string'
  ) {
    redirect(withParams(backPath, { error: 'invalid' }));
  }

  const outcome = await createBooking(session.token, {
    id: bookingId,
    resourceId,
    startsAt,
    endsAt,
    idempotencyKey,
  });

  if (!outcome.ok) {
    if (outcome.error === 'unauthorized') {
      await clearSession();

      redirect(
        withParams('/login', {
          error: 'session-expired',
          next: backPath,
        }),
      );
    }

    redirect(withParams(backPath, { error: outcome.error }));
  }

  redirect(
    withParams(backPath, {
      booked: outcome.booking.id,
    }),
  );
}
import { apiUrl } from './api-url';

export interface CreateBookingInput {
  id: string;
  resourceId: string;
  startsAt: string;
  endsAt: string;
  idempotencyKey: string;
}

export type BookingOutcome =
  | {
      ok: true;
      booking: {
        id: string;
        startsAt: string;
        endsAt: string;
        status: string;
      };
    }
  | {
      ok: false;
      error: 'unauthorized' | 'forbidden' | 'conflict' | 'invalid';
    };

export async function createBooking(
  token: string,
  input: CreateBookingInput,
): Promise<BookingOutcome> {
  const response = await fetch(apiUrl('/api/bookings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      id: input.id,
      resourceId: input.resourceId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    }),
    cache: 'no-store',
  });

  if (response.status === 401) {
    return { ok: false, error: 'unauthorized' };
  }

  if (response.status === 403) {
    return { ok: false, error: 'forbidden' };
  }

  if (response.status === 409) {
    return { ok: false, error: 'conflict' };
  }

  if (response.status === 400) {
    return { ok: false, error: 'invalid' };
  }

  if (!response.ok) {
    throw new Error(
      `Booking request failed with status ${response.status}`,
    );
  }

  const body = (await response.json()) as {
    data: {
      id: string;
      startsAt: string;
      endsAt: string;
      status: string;
    };
  };

  return {
    ok: true,
    booking: {
      id: body.data.id,
      startsAt: body.data.startsAt,
      endsAt: body.data.endsAt,
      status: body.data.status,
    },
  };
}
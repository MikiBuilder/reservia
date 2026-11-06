import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createBooking } from '../src/lib/bookings';

const input = {
  id: 'booking-1',
  resourceId: 'demo-resource-1',
  startsAt: '2026-08-31T08:00:00.000Z',
  endsAt: '2026-08-31T09:00:00.000Z',
  idempotencyKey: 'key-1',
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

describe('createBooking', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the token, the idempotency key and no customerId', async () => {
    const fetchMock = stubFetch({
      ok: true,
      status: 201,
      body: {
        data: {
          id: 'booking-1',
          startsAt: '2026-08-31T08:00:00.000Z',
          endsAt: '2026-08-31T09:00:00.000Z',
          status: 'CONFIRMED',
        },
      },
    });

    const outcome = await createBooking('token-1', input);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-1',
          'Idempotency-Key': 'key-1',
        },
        body: JSON.stringify({
          id: 'booking-1',
          resourceId: 'demo-resource-1',
          startsAt: '2026-08-31T08:00:00.000Z',
          endsAt: '2026-08-31T09:00:00.000Z',
        }),
        cache: 'no-store',
      },
    );
    expect(outcome).toEqual({
      ok: true,
      booking: {
        id: 'booking-1',
        startsAt: '2026-08-31T08:00:00.000Z',
        endsAt: '2026-08-31T09:00:00.000Z',
        status: 'CONFIRMED',
      },
    });
  });

  it('maps the expected failures', async () => {
    const cases = [
      { status: 401, error: 'unauthorized' },
      { status: 403, error: 'forbidden' },
      { status: 409, error: 'conflict' },
      { status: 400, error: 'invalid' },
    ] as const;

    for (const testCase of cases) {
      stubFetch({
        ok: false,
        status: testCase.status,
      });

      await expect(
        createBooking('token-1', input),
      ).resolves.toEqual({
        ok: false,
        error: testCase.error,
      });
    }
  });

  it('throws on unexpected failures', async () => {
    stubFetch({ ok: false, status: 503 });

    await expect(
      createBooking('token-1', input),
    ).rejects.toThrow(
      'Booking request failed with status 503',
    );
  });
});
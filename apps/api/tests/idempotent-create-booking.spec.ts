import { describe, expect, it } from 'vitest';

import { AvailabilityService } from '../src/modules/availability/domain/availability-service.js';
import { BusinessHours } from '../src/modules/availability/domain/business-hours.js';
import { DailySchedule } from '../src/modules/availability/domain/daily-schedule.js';
import { DayOfWeek } from '../src/modules/availability/domain/day-of-week.js';

import { CreateBooking } from '../src/modules/bookings/application/create-booking.js';
import { IdempotentCreateBooking } from '../src/modules/bookings/application/idempotent-create-booking.js';
import { IdempotencyService } from '../src/modules/bookings/application/idempotency-service.js';

import { BookingConflictPolicy } from '../src/modules/bookings/domain/booking-conflict.js';
import { TimeRange } from '../src/modules/bookings/domain/time-range.js';

import { Resource } from '../src/modules/resources/domain/resource.js';

import { InMemoryBookingRepository } from './in-memory-booking-repository.js';
import { InMemoryIdempotencyRepository } from './in-memory-idempotency-repository.js';
import { InMemoryOutboxRepository } from './in-memory-outbox-repository.js';
import { InMemoryTransactionManager } from './in-memory-transaction-manager.js';

const createPeriod = (): TimeRange =>
  TimeRange.create(
    new Date('2026-08-31T10:00:00.000Z'),
    new Date('2026-08-31T11:00:00.000Z'),
  );

const createResource = (): Resource =>
  Resource.create({
    id: 'resource-idempotency-1',
    name: 'Sala Idempotencia',
    capacity: 8,
  });

const createBusinessHours = (): BusinessHours =>
  BusinessHours.create({
    [DayOfWeek.MONDAY]: DailySchedule.create(
      '08:00',
      '20:00',
    ),
  });

const createIdempotentUseCase = () => {
  const bookingRepository =
    new InMemoryBookingRepository();

  const outboxRepository =
    new InMemoryOutboxRepository();

  const transactionManager =
    new InMemoryTransactionManager();

  const idempotencyRepository =
    new InMemoryIdempotencyRepository();

  const createBooking = new CreateBooking(
    bookingRepository,
    outboxRepository,
    transactionManager,
    new AvailabilityService(
      new BookingConflictPolicy(),
    ),
  );

  const idempotentCreateBooking =
    new IdempotentCreateBooking(
      createBooking,
      idempotencyRepository,
      new IdempotencyService(
        idempotencyRepository,
      ),
    );

  return {
    bookingRepository,
    outboxRepository,
    idempotencyRepository,
    idempotentCreateBooking,
  };
};

describe('IdempotentCreateBooking', () => {
  it('creates a booking only once for the same idempotency key', async () => {
    const {
      bookingRepository,
      outboxRepository,
      idempotentCreateBooking,
    } = createIdempotentUseCase();

    const firstRequest = {
      id: 'booking-idempotency-1',
      customerId: 'customer-1',
      resource: createResource(),
      businessHours: createBusinessHours(),
      period: createPeriod(),
      blackouts: [],
      idempotencyKey: 'idempotency-key-1',
      requestHash: 'request-hash-1',
    };

    const firstBooking =
      await idempotentCreateBooking.execute(
        firstRequest,
      );

    const secondBooking =
      await idempotentCreateBooking.execute({
        ...firstRequest,
        id: 'booking-idempotency-2',
      });

    expect(firstBooking.id).toBe(
      'booking-idempotency-1',
    );

    expect(secondBooking.id).toBe(
      firstBooking.id,
    );

    expect(secondBooking.currentStatus).toBe(
      'CONFIRMED',
    );

    expect(
      secondBooking.period.startsAt.toISOString(),
    ).toBe('2026-08-31T10:00:00.000Z');

    expect(
      secondBooking.period.endsAt.toISOString(),
    ).toBe('2026-08-31T11:00:00.000Z');

    expect(bookingRepository.bookings).toHaveLength(1);
    expect(outboxRepository.events).toHaveLength(1);
  });

  it('rejects reusing a key with a different request hash', async () => {
    const { idempotentCreateBooking } =
      createIdempotentUseCase();

    const request = {
      id: 'booking-idempotency-3',
      customerId: 'customer-1',
      resource: createResource(),
      businessHours: createBusinessHours(),
      period: createPeriod(),
      blackouts: [],
      idempotencyKey: 'idempotency-key-2',
      requestHash: 'request-hash-original',
    };

    await idempotentCreateBooking.execute(request);

    await expect(
      idempotentCreateBooking.execute({
        ...request,
        id: 'booking-idempotency-4',
        requestHash: 'request-hash-different',
      }),
    ).rejects.toThrow('IDEMPOTENCY_KEY_REUSED');
  });

  it('requires an idempotency key', async () => {
    const { idempotentCreateBooking } =
      createIdempotentUseCase();

    await expect(
      idempotentCreateBooking.execute({
        id: 'booking-idempotency-5',
        customerId: 'customer-1',
        resource: createResource(),
        businessHours: createBusinessHours(),
        period: createPeriod(),
        blackouts: [],
        idempotencyKey: ' ',
        requestHash: 'request-hash-5',
      }),
    ).rejects.toThrow('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('requires a request hash', async () => {
    const { idempotentCreateBooking } =
      createIdempotentUseCase();

    await expect(
      idempotentCreateBooking.execute({
        id: 'booking-idempotency-6',
        customerId: 'customer-1',
        resource: createResource(),
        businessHours: createBusinessHours(),
        period: createPeriod(),
        blackouts: [],
        idempotencyKey: 'idempotency-key-6',
        requestHash: ' ',
      }),
    ).rejects.toThrow(
      'IDEMPOTENCY_REQUEST_HASH_REQUIRED',
    );
  });
});
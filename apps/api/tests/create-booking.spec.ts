import { describe, expect, it } from 'vitest';

import { AvailabilityService } from '../src/modules/availability/domain/availability-service.js';
import { BusinessHours } from '../src/modules/availability/domain/business-hours.js';
import { DailySchedule } from '../src/modules/availability/domain/daily-schedule.js';
import { DayOfWeek } from '../src/modules/availability/domain/day-of-week.js';

import { BookingConflictPolicy } from '../src/modules/bookings/domain/booking-conflict.js';
import { TimeRange } from '../src/modules/bookings/domain/time-range.js';
import { CreateBooking } from '../src/modules/bookings/application/create-booking.js';

import { Resource } from '../src/modules/resources/domain/resource.js';

import { InMemoryBookingRepository } from './in-memory-booking-repository.js';
import { InMemoryOutboxRepository } from './in-memory-outbox-repository.js';
import { InMemoryTransactionManager } from './in-memory-transaction-manager.js';

const createPeriod = (): TimeRange =>
  TimeRange.create(
    new Date('2026-08-31T10:00:00Z'),
    new Date('2026-08-31T11:00:00Z'),
  );

const createResource = (): Resource =>
  Resource.create({
    id: 'resource-1',
    name: 'Sala Mediterránea',
    capacity: 8,
  });

const createBusinessHours = (): BusinessHours =>
  BusinessHours.create({
    [DayOfWeek.MONDAY]: DailySchedule.create('08:00', '20:00'),
  });

const createUseCase = (
  repository: InMemoryBookingRepository,
) => {
  const outboxRepository = new InMemoryOutboxRepository();
  const transactionManager = new InMemoryTransactionManager();

  const useCase = new CreateBooking(
    repository,
    outboxRepository,
    transactionManager,
    new AvailabilityService(new BookingConflictPolicy()),
  );

  return {
    useCase,
    outboxRepository,
  };
};

describe('CreateBooking', () => {
  it('creates and confirms a valid booking', async () => {
    const repository = new InMemoryBookingRepository();

    const {
      useCase: createBooking,
      outboxRepository,
    } = createUseCase(repository);

    const booking = await createBooking.execute({
      id: 'booking-1',
      customerId: 'customer-1',
      resource: createResource(),
      businessHours: createBusinessHours(),
      period: createPeriod(),
      blackouts: [],
    });

    expect(booking.currentStatus).toBe('CONFIRMED');
    expect(repository.bookings).toHaveLength(1);

    expect(outboxRepository.events).toHaveLength(1);
    expect(outboxRepository.events[0]?.type).toBe(
      'BookingCreated',
    );
    expect(outboxRepository.events[0]?.bookingId).toBe(
      'booking-1',
    );
  });

  it('rejects a booking when the resource is not available', async () => {
    const repository = new InMemoryBookingRepository();

    const { useCase: createBooking } =
      createUseCase(repository);

    await createBooking.execute({
      id: 'booking-1',
      customerId: 'customer-1',
      resource: createResource(),
      businessHours: createBusinessHours(),
      period: createPeriod(),
      blackouts: [],
    });

    await expect(
      createBooking.execute({
        id: 'booking-2',
        customerId: 'customer-2',
        resource: createResource(),
        businessHours: createBusinessHours(),
        period: TimeRange.create(
          new Date('2026-08-31T10:30:00Z'),
          new Date('2026-08-31T11:30:00Z'),
        ),
        blackouts: [],
      }),
    ).rejects.toThrow('RESOURCE_NOT_AVAILABLE');

    expect(repository.bookings).toHaveLength(1);
  });
});
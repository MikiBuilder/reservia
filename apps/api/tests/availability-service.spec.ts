import { describe, expect, it } from 'vitest';
import { AvailabilityService } from '../src/modules/availability/domain/availability-service.js';
import { BlackoutPeriod } from '../src/modules/availability/domain/blackout-period.js';
import { BusinessHours } from '../src/modules/availability/domain/business-hours.js';
import { DayOfWeek } from '../src/modules/availability/domain/day-of-week.js';
import { Booking } from '../src/modules/bookings/domain/booking.js';
import { BookingConflictPolicy } from '../src/modules/bookings/domain/booking-conflict.js';
import { TimeRange } from '../src/modules/bookings/domain/time-range.js';
import { Resource } from '../src/modules/resources/domain/resource.js';
import { DailySchedule } from '../src/modules/availability/domain/daily-schedule.js';

const period = (from: string, to: string): TimeRange =>
  TimeRange.create(new Date(from), new Date(to));

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

describe('AvailabilityService', () => {
  it('allows an available resource to be booked', () => {
    const service = new AvailabilityService(
      new BookingConflictPolicy(),
    );

    const result = service.canBeBooked({
      resource: createResource(),
      businessHours: createBusinessHours(),
      period: period(
        '2026-08-31T10:00:00Z',
        '2026-08-31T11:00:00Z',
      ),
      blackouts: [],
      existingBookings: [],
    });

    expect(result).toBe(true);
  });

  it('rejects a resource outside business hours', () => {
    const service = new AvailabilityService(
      new BookingConflictPolicy(),
    );

    const result = service.canBeBooked({
      resource: createResource(),
      businessHours: createBusinessHours(),
      period: period(
        '2026-08-31T21:00:00Z',
        '2026-08-31T22:00:00Z',
      ),
      blackouts: [],
      existingBookings: [],
    });

    expect(result).toBe(false);
  });

  it('rejects a resource affected by a blackout', () => {
    const service = new AvailabilityService(
      new BookingConflictPolicy(),
    );

    const result = service.canBeBooked({
      resource: createResource(),
      businessHours: createBusinessHours(),
      period: period(
        '2026-08-31T10:00:00Z',
        '2026-08-31T11:00:00Z',
      ),
      blackouts: [
        BlackoutPeriod.create({
          id: 'blackout-1',
          resourceId: 'resource-1',
          period: period(
            '2026-08-31T10:30:00Z',
            '2026-08-31T12:00:00Z',
          ),
          reason: 'MAINTENANCE',
        }),
      ],
      existingBookings: [],
    });

    expect(result).toBe(false);
  });

  it('rejects a resource with an overlapping booking', () => {
    const existingBooking = Booking.create({
      id: 'booking-1',
      resourceId: 'resource-1',
      customerId: 'customer-1',
      period: period(
        '2026-08-31T10:00:00Z',
        '2026-08-31T11:00:00Z',
      ),
    });

    existingBooking.confirm();

    const service = new AvailabilityService(
      new BookingConflictPolicy(),
    );

    const result = service.canBeBooked({
      resource: createResource(),
      businessHours: createBusinessHours(),
      period: period(
        '2026-08-31T10:30:00Z',
        '2026-08-31T11:30:00Z',
      ),
      blackouts: [],
      existingBookings: [existingBooking],
    });

    expect(result).toBe(false);
  });
});
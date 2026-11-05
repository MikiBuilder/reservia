import { describe, expect, it } from 'vitest';

import { AvailabilityService } from '../src/modules/availability/domain/availability-service.js';
import { BlackoutPeriod } from '../src/modules/availability/domain/blackout-period.js';
import { BusinessHours } from '../src/modules/availability/domain/business-hours.js';
import { DailySchedule } from '../src/modules/availability/domain/daily-schedule.js';
import { DayOfWeek } from '../src/modules/availability/domain/day-of-week.js';
import { Booking } from '../src/modules/bookings/domain/booking.js';
import { BookingConflictPolicy } from '../src/modules/bookings/domain/booking-conflict.js';
import { TimeRange } from '../src/modules/bookings/domain/time-range.js';
import { Resource } from '../src/modules/resources/domain/resource.js';

const monday = new Date('2026-08-31T00:00:00.000Z');

const createService = (): AvailabilityService =>
  new AvailabilityService(new BookingConflictPolicy());

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

const formatSlot = (slot: TimeRange): string =>
  `${slot.startsAt.toISOString().slice(11, 16)}-${slot.endsAt
    .toISOString()
    .slice(11, 16)}`;

describe('AvailabilityService.findAvailableSlots', () => {
  it('returns the hourly slots of the day', () => {
    const slots = createService().findAvailableSlots({
      resource: createResource(),
      businessHours: createBusinessHours(),
      blackouts: [],
      existingBookings: [],
      date: monday,
    });

    expect(slots.map(formatSlot)).toEqual([
      '08:00-09:00',
      '09:00-10:00',
      '10:00-11:00',
      '11:00-12:00',
      '12:00-13:00',
      '13:00-14:00',
      '14:00-15:00',
      '15:00-16:00',
      '16:00-17:00',
      '17:00-18:00',
      '18:00-19:00',
      '19:00-20:00',
    ]);
  });

  it('excludes the slots that are already booked', () => {
    const booking = Booking.create({
      id: 'booking-1',
      resourceId: 'resource-1',
      customerId: 'customer-1',
      period: TimeRange.create(
        new Date('2026-08-31T10:00:00.000Z'),
        new Date('2026-08-31T11:00:00.000Z'),
      ),
    });

    booking.confirm();

    const slots = createService().findAvailableSlots({
      resource: createResource(),
      businessHours: createBusinessHours(),
      blackouts: [],
      existingBookings: [booking],
      date: monday,
    });

    expect(slots.map(formatSlot)).not.toContain(
      '10:00-11:00',
    );
  });

  it('excludes the slots affected by a blackout', () => {
    const blackout = BlackoutPeriod.create({
      id: 'blackout-1',
      resourceId: 'resource-1',
      period: TimeRange.create(
        new Date('2026-08-31T14:00:00.000Z'),
        new Date('2026-08-31T16:00:00.000Z'),
      ),
      reason: 'MAINTENANCE',
    });

    const slots = createService().findAvailableSlots({
      resource: createResource(),
      businessHours: createBusinessHours(),
      blackouts: [blackout],
      existingBookings: [],
      date: monday,
    });

    const formatted = slots.map(formatSlot);

    expect(formatted).not.toContain('14:00-15:00');
    expect(formatted).not.toContain('15:00-16:00');
  });

  it('returns no slots on a closed day', () => {
    const slots = createService().findAvailableSlots({
      resource: createResource(),
      businessHours: createBusinessHours(),
      blackouts: [],
      existingBookings: [],
      date: new Date('2026-08-30T00:00:00.000Z'),
    });

    expect(slots).toEqual([]);
  });
});
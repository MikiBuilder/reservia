import { describe, expect, it } from 'vitest';
import { Booking } from '../src/modules/bookings/domain/booking.js';
import { BookingConflictPolicy } from '../src/modules/bookings/domain/booking-conflict.js';
import { TimeRange } from '../src/modules/bookings/domain/time-range.js';

const period = (from: string, to: string) => TimeRange.create(new Date(from), new Date(to));

describe('TimeRange', () => {
  it('detects overlapping intervals but allows adjacent ones', () => {
    expect(period('2026-08-28T09:00:00Z', '2026-08-28T10:00:00Z').overlaps(period('2026-08-28T09:30:00Z', '2026-08-28T11:00:00Z'))).toBe(true);
    expect(period('2026-08-28T09:00:00Z', '2026-08-28T10:00:00Z').overlaps(period('2026-08-28T10:00:00Z', '2026-08-28T11:00:00Z'))).toBe(false);
  });
});

describe('Booking', () => {
  it('controls valid lifecycle transitions', () => {
    const booking = Booking.create({ id: 'b-1', resourceId: 'r-1', customerId: 'u-1', period: period('2026-08-28T09:00:00Z', '2026-08-28T10:00:00Z') });
    booking.confirm();
    expect(booking.currentStatus).toBe('CONFIRMED');
    booking.cancel();
    expect(booking.currentStatus).toBe('CANCELLED');
  });
});

describe('BookingConflictPolicy', () => {
  it('rejects an active overlapping booking', () => {
    const existing = Booking.create({ id: 'b-1', resourceId: 'r-1', customerId: 'u-1', period: period('2026-08-28T09:00:00Z', '2026-08-28T10:00:00Z') });
    existing.confirm();
    expect(() => new BookingConflictPolicy().ensureNoConflict('r-1', period('2026-08-28T09:30:00Z', '2026-08-28T11:00:00Z'), [existing])).toThrow('BOOKING_CONFLICT');
  });

  it('ignores cancelled bookings', () => {
    const existing = Booking.create({ id: 'b-1', resourceId: 'r-1', customerId: 'u-1', period: period('2026-08-28T09:00:00Z', '2026-08-28T10:00:00Z') });
    existing.cancel();
    expect(() => new BookingConflictPolicy().ensureNoConflict('r-1', period('2026-08-28T09:30:00Z', '2026-08-28T11:00:00Z'), [existing])).not.toThrow();
  });
});

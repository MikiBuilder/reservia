import { Booking } from './booking.js';
import { TimeRange } from './time-range.js';
import { Injectable } from '@nestjs/common';

/** Política de dominio: dos reservas activas del mismo recurso no pueden solaparse. */
@Injectable()
export class BookingConflictPolicy {
  ensureNoConflict(resourceId: string, period: TimeRange, existingBookings: Booking[]): void {
    const conflict = existingBookings.some((booking) =>
      booking.resourceId === resourceId && booking.isActive() && booking.period.overlaps(period),
    );
    if (conflict) throw new Error('BOOKING_CONFLICT');
  }
}

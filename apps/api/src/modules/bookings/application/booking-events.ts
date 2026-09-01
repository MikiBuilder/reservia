import { Booking } from '../domain/booking.js';

export interface BookingCreatedEvent {
  type: 'BookingCreated';
  bookingId: string;
  resourceId: string;
  customerId: string;
  startsAt: Date;
  endsAt: Date;
  occurredAt: Date;
}

export const bookingCreatedEventFrom = (
  booking: Booking,
): BookingCreatedEvent => ({
  type: 'BookingCreated',
  bookingId: booking.id,
  resourceId: booking.resourceId,
  customerId: booking.customerId,
  startsAt: booking.period.startsAt,
  endsAt: booking.period.endsAt,
  occurredAt: new Date(),
});
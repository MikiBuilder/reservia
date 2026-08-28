import { Booking } from '../src/modules/bookings/domain/booking.js';
import { BookingRepository } from '../src/modules/bookings/application/booking-repository.js';

export class InMemoryBookingRepository implements BookingRepository {
  readonly bookings: Booking[] = [];

  async findActiveByResourceId(resourceId: string): Promise<Booking[]> {
    return this.bookings.filter(
      (booking) =>
        booking.resourceId === resourceId &&
        booking.isActive(),
    );
  }

  async save(booking: Booking): Promise<void> {
    this.bookings.push(booking);
  }
}
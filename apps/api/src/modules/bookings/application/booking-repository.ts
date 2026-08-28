import { Booking } from '../domain/booking.js';

export interface BookingRepository {
  findActiveByResourceId(resourceId: string): Promise<Booking[]>;
  save(booking: Booking): Promise<void>;
}
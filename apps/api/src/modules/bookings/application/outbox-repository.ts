import { BookingCreatedEvent } from './booking-events.js';

export interface OutboxRepository {
  saveBookingCreated(event: BookingCreatedEvent): Promise<void>;
}
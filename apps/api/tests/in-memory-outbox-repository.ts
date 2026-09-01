import { BookingCreatedEvent } from '../src/modules/bookings/application/booking-events.js';
import { OutboxRepository } from '../src/modules/bookings/application/outbox-repository.js';

export class InMemoryOutboxRepository
  implements OutboxRepository
{
  readonly events: BookingCreatedEvent[] = [];

  async saveBookingCreated(
    event: BookingCreatedEvent,
  ): Promise<void> {
    this.events.push(event);
  }
}
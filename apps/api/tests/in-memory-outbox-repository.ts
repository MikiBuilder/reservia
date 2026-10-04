import { BookingCreatedEvent } from '../src/modules/bookings/application/booking-events.js';
import {
  OutboxRepository,
  PendingOutboxMessage,
} from '../src/modules/bookings/application/outbox-repository.js';

export class InMemoryOutboxRepository
  implements OutboxRepository
{
  readonly events: BookingCreatedEvent[] = [];

  async saveBookingCreated(
    event: BookingCreatedEvent,
  ): Promise<void> {
    this.events.push(event);
  }

  async findPending(
    limit: number,
  ): Promise<PendingOutboxMessage[]> {
    return this.events
      .slice(0, limit)
      .map((event) => ({
        id: event.bookingId,
        eventType: event.type,
        aggregateId: event.bookingId,
        payload: event,
        attempts: 0,
        occurredAt: event.occurredAt,
      }));
  }

  async markProcessed(id: string): Promise<void> {
    const index = this.events.findIndex(
      (event) => event.bookingId === id,
    );

    if (index >= 0) {
      this.events.splice(index, 1);
    }
  }

  async markFailed(
    _id: string,
    _error: string,
  ): Promise<void> {
    // No necesitamos persistir errores en esta
    // implementación mínima utilizada por tests.
  }
}
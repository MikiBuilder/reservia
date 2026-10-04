import { BookingCreatedEvent } from './booking-events.js';

export interface PendingOutboxMessage {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: unknown;
  attempts: number;
  occurredAt: Date;
}

export interface OutboxRepository {
  saveBookingCreated(
    event: BookingCreatedEvent,
  ): Promise<void>;

  findPending(limit: number): Promise<PendingOutboxMessage[]>;

  markProcessed(id: string): Promise<void>;

  markFailed(
    id: string,
    error: string,
  ): Promise<void>;
}
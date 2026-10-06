import { describe, expect, it } from 'vitest';

import { BookingCreatedEventProcessor } from '../src/modules/bookings/application/booking-created-event-processor.js';
import { ProcessOutboxMessages } from '../src/modules/bookings/application/process-outbox-messages.js';
import { PendingOutboxMessage } from '../src/modules/bookings/application/outbox-repository.js';

import { InMemoryOutboxRepository } from './in-memory-outbox-repository.js';

const createMessage = (
  id: string,
  eventType = 'BookingCreated',
): PendingOutboxMessage => ({
  id,
  eventType,
  aggregateId: `aggregate-${id}`,
  payload: {
    type: eventType,
    bookingId: `booking-${id}`,
  },
  attempts: 0,
  occurredAt: new Date(),
});

class RecordingEventProcessor {
  readonly processed: string[] = [];

  constructor(
    private readonly failingIds: string[] = [],
  ) {}

  async process(
    message: PendingOutboxMessage,
  ): Promise<void> {
    if (this.failingIds.includes(message.id)) {
      throw new Error('PROCESSING_FAILED');
    }

    this.processed.push(message.id);
  }
}

describe('ProcessOutboxMessages', () => {
  it('processes pending messages successfully', async () => {
    const repository =
      new InMemoryOutboxRepository();

    const processor =
      new RecordingEventProcessor();

    await repository.saveBookingCreated({
      type: 'BookingCreated',
      bookingId: 'booking-1',
      resourceId: 'resource-1',
      customerId: 'customer-1',
      startsAt: new Date(
        '2026-08-31T10:00:00.000Z',
      ),
      endsAt: new Date(
        '2026-08-31T11:00:00.000Z',
      ),
      occurredAt: new Date(),
    });

    const useCase = new ProcessOutboxMessages(
      repository,
      processor,
    );

    const result = await useCase.execute();

    expect(result).toEqual({
      processed: 1,
      failed: 0,
    });

    expect(processor.processed).toHaveLength(1);
    expect(repository.events).toHaveLength(0);
  });

  it('marks a message as failed when processing throws', async () => {
    const repository =
      new InMemoryOutboxRepository();

    const processor =
      new RecordingEventProcessor([
        'booking-2',
      ]);

    await repository.saveBookingCreated({
      type: 'BookingCreated',
      bookingId: 'booking-2',
      resourceId: 'resource-1',
      customerId: 'customer-1',
      startsAt: new Date(
        '2026-08-31T10:00:00.000Z',
      ),
      endsAt: new Date(
        '2026-08-31T11:00:00.000Z',
      ),
      occurredAt: new Date(),
    });

    const useCase = new ProcessOutboxMessages(
      repository,
      processor,
    );

    const result = await useCase.execute();

    expect(result).toEqual({
      processed: 0,
      failed: 1,
    });

    expect(processor.processed).toHaveLength(0);
  });

  it('continues after a message fails', async () => {
    const repository =
      new InMemoryOutboxRepository();

    const processor =
      new RecordingEventProcessor([
        'booking-3',
      ]);

    await repository.saveBookingCreated({
      type: 'BookingCreated',
      bookingId: 'booking-3',
      resourceId: 'resource-1',
      customerId: 'customer-1',
      startsAt: new Date(
        '2026-08-31T10:00:00.000Z',
      ),
      endsAt: new Date(
        '2026-08-31T11:00:00.000Z',
      ),
      occurredAt: new Date(),
    });

    await repository.saveBookingCreated({
      type: 'BookingCreated',
      bookingId: 'booking-4',
      resourceId: 'resource-1',
      customerId: 'customer-2',
      startsAt: new Date(
        '2026-08-31T12:00:00.000Z',
      ),
      endsAt: new Date(
        '2026-08-31T13:00:00.000Z',
      ),
      occurredAt: new Date(),
    });

    const useCase = new ProcessOutboxMessages(
      repository,
      processor,
    );

    const result = await useCase.execute();

    expect(result).toEqual({
      processed: 1,
      failed: 1,
    });

    expect(processor.processed).toEqual([
      'booking-4',
    ]);
  });

  it('respects the message limit', async () => {
    const repository =
      new InMemoryOutboxRepository();

    const processor =
      new RecordingEventProcessor();

    for (const bookingId of [
      'booking-5',
      'booking-6',
      'booking-7',
    ]) {
      await repository.saveBookingCreated({
        type: 'BookingCreated',
        bookingId,
        resourceId: 'resource-1',
        customerId: 'customer-1',
        startsAt: new Date(
          '2026-08-31T10:00:00.000Z',
        ),
        endsAt: new Date(
          '2026-08-31T11:00:00.000Z',
        ),
        occurredAt: new Date(),
      });
    }

    const useCase = new ProcessOutboxMessages(
      repository,
      processor,
    );

    const result = await useCase.execute(2);

    expect(result).toEqual({
      processed: 2,
      failed: 0,
    });

    expect(processor.processed).toHaveLength(2);
  });

  it('fails unsupported event types', async () => {
    const repository =
      new InMemoryOutboxRepository();

    const processor =
      new BookingCreatedEventProcessor();

    await repository.saveBookingCreated({
      type: 'BookingCreated',
      bookingId: 'booking-8',
      resourceId: 'resource-1',
      customerId: 'customer-1',
      startsAt: new Date(
        '2026-08-31T10:00:00.000Z',
      ),
      endsAt: new Date(
        '2026-08-31T11:00:00.000Z',
      ),
      occurredAt: new Date(),
    });

    const useCase = new ProcessOutboxMessages(
      repository,
      processor,
    );

    const result = await useCase.execute();

    expect(result).toEqual({
      processed: 1,
      failed: 0,
    });
  });
});
import { describe, expect, it } from 'vitest';

import { CleanupExpiredIdempotency } from '../src/modules/bookings/application/cleanup-expired-idempotency.js';
import { InMemoryIdempotencyRepository } from './in-memory-idempotency-repository.js';

describe('CleanupExpiredIdempotency', () => {
  it('deletes expired records', async () => {
    const repository =
      new InMemoryIdempotencyRepository();

    const now = new Date(
      '2026-10-01T12:00:00.000Z',
    );

    await repository.createProcessing({
      id: 'expired-record',
      key: 'expired-key',
      operation: 'CreateBooking',
      requestHash: 'hash-1',
      expiresAt: new Date(
        '2026-10-01T11:00:00.000Z',
      ),
    });

    await repository.createProcessing({
      id: 'active-record',
      key: 'active-key',
      operation: 'CreateBooking',
      requestHash: 'hash-2',
      expiresAt: new Date(
        '2026-10-01T13:00:00.000Z',
      ),
    });

    const useCase =
      new CleanupExpiredIdempotency(repository);

    const result = await useCase.execute(now);

    expect(result.deleted).toBe(1);
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0]?.id).toBe(
      'active-record',
    );
  });

  it('respects the cleanup limit', async () => {
    const repository =
      new InMemoryIdempotencyRepository();

    const now = new Date(
      '2026-10-01T12:00:00.000Z',
    );

    for (const id of [
      'expired-1',
      'expired-2',
      'expired-3',
    ]) {
      await repository.createProcessing({
        id,
        key: `${id}-key`,
        operation: 'CreateBooking',
        requestHash: id,
        expiresAt: new Date(
          '2026-10-01T11:00:00.000Z',
        ),
      });
    }

    const useCase =
      new CleanupExpiredIdempotency(repository);

    const result = await useCase.execute(now, 2);

    expect(result.deleted).toBe(2);
    expect(repository.records).toHaveLength(1);
  });
});
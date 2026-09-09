import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { PrismaClient } from '@prisma/client';
import { PrismaIdempotencyRepository } from '../src/modules/bookings/infrastructure/prisma-idempotency-repository.js';

const integrationTestsEnabled =
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)(
  'PrismaIdempotencyRepository integration',
  () => {
    const prisma = new PrismaClient();
    const repository = new PrismaIdempotencyRepository(
      prisma,
    );

    beforeEach(async () => {
      await prisma.idempotencyRecord.deleteMany({
        where: {
          operation: 'CreateBooking',
        },
      });
    });

    afterAll(async () => {
      await prisma.idempotencyRecord.deleteMany({
        where: {
          operation: 'CreateBooking',
        },
      });

      await prisma.$disconnect();
    });

    it('creates and retrieves a processing record', async () => {
      const expiresAt = new Date(
        '2026-09-10T12:00:00.000Z',
      );

      const created =
        await repository.createProcessing({
          id: 'idempotency-record-1',
          key: 'booking-key-1',
          operation: 'CreateBooking',
          requestHash: 'hash-1',
          expiresAt,
        });

      expect(created.id).toBe('idempotency-record-1');
      expect(created.key).toBe('booking-key-1');
      expect(created.status).toBe('PROCESSING');

      const found = await repository.find(
        'CreateBooking',
        'booking-key-1',
      );

      expect(found).not.toBeNull();
      expect(found?.requestHash).toBe('hash-1');
      expect(found?.status).toBe('PROCESSING');
    });

    it('stores the completed response', async () => {
      await repository.createProcessing({
        id: 'idempotency-record-2',
        key: 'booking-key-2',
        operation: 'CreateBooking',
        requestHash: 'hash-2',
        expiresAt: new Date(
          '2026-09-10T12:00:00.000Z',
        ),
      });

      await repository.markCompleted({
        id: 'idempotency-record-2',
        responseStatus: 201,
        responseBody: {
          id: 'booking-1',
          status: 'CONFIRMED',
        },
      });

      const found = await repository.find(
        'CreateBooking',
        'booking-key-2',
      );

      expect(found?.status).toBe('COMPLETED');
      expect(found?.responseStatus).toBe(201);
      expect(found?.responseBody).toEqual({
        id: 'booking-1',
        status: 'CONFIRMED',
      });
      expect(found?.completedAt).not.toBeNull();
    });

    it('stores a failed response', async () => {
      await repository.createProcessing({
        id: 'idempotency-record-3',
        key: 'booking-key-3',
        operation: 'CreateBooking',
        requestHash: 'hash-3',
        expiresAt: new Date(
          '2026-09-10T12:00:00.000Z',
        ),
      });

      await repository.markFailed({
        id: 'idempotency-record-3',
        error: 'RESOURCE_NOT_AVAILABLE',
      });

      const found = await repository.find(
        'CreateBooking',
        'booking-key-3',
      );

      expect(found?.status).toBe('FAILED');
      expect(found?.responseBody).toEqual({
        error: 'RESOURCE_NOT_AVAILABLE',
      });
    });
  },
);
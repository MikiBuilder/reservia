import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { PrismaClient } from '@prisma/client';

import { CleanupExpiredIdempotency } from '../src/modules/bookings/application/cleanup-expired-idempotency.js';
import { PrismaIdempotencyRepository } from '../src/modules/bookings/infrastructure/prisma-idempotency-repository.js';

const integrationTestsEnabled =
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)(
  'Prisma idempotency cleanup integration',
  () => {
    const prisma = new PrismaClient();

    const operation = 'CleanupIntegration';
    const keyPrefix = 'cleanup-integration-';

    beforeAll(async () => {
      await prisma.idempotencyRecord.deleteMany({
        where: {
          operation,
        },
      });
    });

    beforeEach(async () => {
      await prisma.idempotencyRecord.deleteMany({
        where: {
          operation,
        },
      });
    });

    afterAll(async () => {
      await prisma.idempotencyRecord.deleteMany({
        where: {
          operation,
        },
      });

      await prisma.$disconnect();
    });

    it('deletes expired records from PostgreSQL', async () => {
      const now = new Date(
        '2026-10-01T12:00:00.000Z',
      );

      await prisma.idempotencyRecord.create({
        data: {
          id: 'cleanup-expired-1',
          key: `${keyPrefix}expired`,
          operation,
          requestHash: 'expired-hash',
          status: 'COMPLETED',
          expiresAt: new Date(
            '2026-10-01T11:00:00.000Z',
          ),
        },
      });

      await prisma.idempotencyRecord.create({
        data: {
          id: 'cleanup-active-1',
          key: `${keyPrefix}active`,
          operation,
          requestHash: 'active-hash',
          status: 'COMPLETED',
          expiresAt: new Date(
            '2026-10-01T13:00:00.000Z',
          ),
        },
      });

      const repository =
        new PrismaIdempotencyRepository(prisma);

      const cleanup =
        new CleanupExpiredIdempotency(repository);

      const result = await cleanup.execute(now);

      expect(result.deleted).toBe(1);

      const remaining =
        await prisma.idempotencyRecord.findMany({
          where: {
            operation,
          },
        });

      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.key).toBe(
        `${keyPrefix}active`,
      );
    });

    it('respects the cleanup limit', async () => {
      const now = new Date(
        '2026-10-01T12:00:00.000Z',
      );

      await prisma.idempotencyRecord.createMany({
        data: [
          {
            id: 'cleanup-limit-1',
            key: `${keyPrefix}limit-1`,
            operation,
            requestHash: 'hash-1',
            status: 'COMPLETED',
            expiresAt: new Date(
              '2026-10-01T11:00:00.000Z',
            ),
          },
          {
            id: 'cleanup-limit-2',
            key: `${keyPrefix}limit-2`,
            operation,
            requestHash: 'hash-2',
            status: 'COMPLETED',
            expiresAt: new Date(
              '2026-10-01T11:00:00.000Z',
            ),
          },
          {
            id: 'cleanup-limit-3',
            key: `${keyPrefix}limit-3`,
            operation,
            requestHash: 'hash-3',
            status: 'COMPLETED',
            expiresAt: new Date(
              '2026-10-01T11:00:00.000Z',
            ),
          },
        ],
      });

      const repository =
        new PrismaIdempotencyRepository(prisma);

      const cleanup =
        new CleanupExpiredIdempotency(repository);

      const result = await cleanup.execute(now, 2);

      expect(result.deleted).toBe(2);

      const remaining =
        await prisma.idempotencyRecord.count({
          where: {
            operation,
          },
        });

      expect(remaining).toBe(1);
    });
  },
);
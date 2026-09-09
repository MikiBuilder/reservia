import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { PrismaClient } from '@prisma/client';

import { AvailabilityService } from '../src/modules/availability/domain/availability-service.js';
import { BusinessHours } from '../src/modules/availability/domain/business-hours.js';
import { DailySchedule } from '../src/modules/availability/domain/daily-schedule.js';
import { DayOfWeek } from '../src/modules/availability/domain/day-of-week.js';

import { CreateBooking } from '../src/modules/bookings/application/create-booking.js';
import { IdempotentCreateBooking } from '../src/modules/bookings/application/idempotent-create-booking.js';
import { IdempotencyService } from '../src/modules/bookings/application/idempotency-service.js';

import { BookingConflictPolicy } from '../src/modules/bookings/domain/booking-conflict.js';
import { TimeRange } from '../src/modules/bookings/domain/time-range.js';

import { PrismaBookingRepository } from '../src/modules/bookings/infrastructure/prisma-booking-repository.js';
import { PrismaIdempotencyRepository } from '../src/modules/bookings/infrastructure/prisma-idempotency-repository.js';
import { PrismaOutboxRepository } from '../src/modules/bookings/infrastructure/prisma-outbox-repository.js';
import { PrismaTransactionManager } from '../src/modules/bookings/infrastructure/prisma-transaction-manager.js';

import { Resource } from '../src/modules/resources/domain/resource.js';

const integrationTestsEnabled =
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)(
  'Full idempotent booking integration',
  () => {
    const prisma = new PrismaClient();

    const resourceId = 'full-integration-resource-1';
    const bookingId = 'full-integration-booking-1';
    const idempotencyKey = 'full-integration-key-1';

    const createPeriod = (): TimeRange =>
      TimeRange.create(
        new Date('2026-08-31T10:00:00.000Z'),
        new Date('2026-08-31T11:00:00.000Z'),
      );

    const createResource = (): Resource =>
      Resource.create({
        id: resourceId,
        name: 'Full Integration Room',
        description: 'Resource used by full integration tests',
        capacity: 8,
      });

    const createBusinessHours = (): BusinessHours =>
      BusinessHours.create({
        [DayOfWeek.MONDAY]: DailySchedule.create(
          '08:00',
          '20:00',
        ),
      });

    const createUseCase = (): IdempotentCreateBooking => {
      const bookingRepository =
        new PrismaBookingRepository(prisma);

      const outboxRepository =
        new PrismaOutboxRepository(prisma);

      const idempotencyRepository =
        new PrismaIdempotencyRepository(prisma);

      const transactionManager =
        new PrismaTransactionManager(prisma);

      const createBooking = new CreateBooking(
        bookingRepository,
        outboxRepository,
        transactionManager,
        new AvailabilityService(
          new BookingConflictPolicy(),
        ),
      );

      return new IdempotentCreateBooking(
        createBooking,
        idempotencyRepository,
        new IdempotencyService(
          idempotencyRepository,
        ),
      );
    };

    beforeAll(async () => {
      await prisma.booking.deleteMany({
        where: {
          resourceId,
        },
      });

      await prisma.outboxMessage.deleteMany({
        where: {
          aggregateId: bookingId,
        },
      });

      await prisma.idempotencyRecord.deleteMany({
        where: {
          key: idempotencyKey,
        },
      });

      await prisma.resource.deleteMany({
        where: {
          id: resourceId,
        },
      });

      await prisma.resource.create({
        data: {
          id: resourceId,
          name: 'Full Integration Room',
          description: 'Resource used by full integration tests',
          capacity: 8,
          status: 'ACTIVE',
        },
      });
    });

    beforeEach(async () => {
      await prisma.booking.deleteMany({
        where: {
          resourceId,
        },
      });

      await prisma.outboxMessage.deleteMany({
        where: {
          aggregateId: bookingId,
        },
      });

      await prisma.idempotencyRecord.deleteMany({
        where: {
          key: idempotencyKey,
        },
      });
    });

    afterAll(async () => {
      await prisma.booking.deleteMany({
        where: {
          resourceId,
        },
      });

      await prisma.outboxMessage.deleteMany({
        where: {
          aggregateId: bookingId,
        },
      });

      await prisma.idempotencyRecord.deleteMany({
        where: {
          key: idempotencyKey,
        },
      });

      await prisma.resource.deleteMany({
        where: {
          id: resourceId,
        },
      });

      await prisma.$disconnect();
    });

    it('creates one booking and one idempotency record', async () => {
      const useCase = createUseCase();

      const booking = await useCase.execute({
        id: bookingId,
        customerId: 'full-integration-customer-1',
        resource: createResource(),
        businessHours: createBusinessHours(),
        period: createPeriod(),
        blackouts: [],
        idempotencyKey,
        requestHash: 'full-integration-hash-1',
      });

      expect(booking.id).toBe(bookingId);
      expect(booking.currentStatus).toBe('CONFIRMED');

      const bookings = await prisma.booking.findMany({
        where: {
          resourceId,
        },
      });

      expect(bookings).toHaveLength(1);

      const idempotencyRecord =
        await prisma.idempotencyRecord.findUnique({
          where: {
            key: idempotencyKey,
          },
        });

      expect(idempotencyRecord).not.toBeNull();
      expect(idempotencyRecord?.status).toBe(
        'COMPLETED',
      );
    });

    it('returns the original booking on retry', async () => {
      const useCase = createUseCase();

      const request = {
        id: bookingId,
        customerId: 'full-integration-customer-1',
        resource: createResource(),
        businessHours: createBusinessHours(),
        period: createPeriod(),
        blackouts: [],
        idempotencyKey,
        requestHash: 'full-integration-hash-1',
      };

      const firstBooking =
        await useCase.execute(request);

      const secondBooking = await useCase.execute({
        ...request,
        id: 'full-integration-booking-2',
      });

      expect(secondBooking.id).toBe(
        firstBooking.id,
      );

      const bookings = await prisma.booking.findMany({
        where: {
          resourceId,
        },
      });

      expect(bookings).toHaveLength(1);

      const outboxMessages =
        await prisma.outboxMessage.findMany({
          where: {
            aggregateId: bookingId,
          },
        });

      expect(outboxMessages).toHaveLength(1);
    });

    it('rejects the same key with a different request hash', async () => {
      const useCase = createUseCase();

      await useCase.execute({
        id: bookingId,
        customerId: 'full-integration-customer-1',
        resource: createResource(),
        businessHours: createBusinessHours(),
        period: createPeriod(),
        blackouts: [],
        idempotencyKey,
        requestHash: 'full-integration-hash-1',
      });

      await expect(
        useCase.execute({
          id: 'full-integration-booking-3',
          customerId: 'full-integration-customer-2',
          resource: createResource(),
          businessHours: createBusinessHours(),
          period: createPeriod(),
          blackouts: [],
          idempotencyKey,
          requestHash: 'different-request-hash',
        }),
      ).rejects.toThrow('IDEMPOTENCY_KEY_REUSED');
    });
  },
);
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaBookingRepository } from '../src/modules/bookings/infrastructure/prisma-booking-repository.js';
import { Booking } from '../src/modules/bookings/domain/booking.js';
import { TimeRange } from '../src/modules/bookings/domain/time-range.js';

const integrationTestsEnabled =
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)(
  'PrismaBookingRepository integration',
  () => {
    const prisma = new PrismaClient();
    const repository = new PrismaBookingRepository(prisma);

    const resourceId = 'integration-resource-1';

    const createPeriod = (): TimeRange =>
      TimeRange.create(
        new Date('2026-08-31T10:00:00.000Z'),
        new Date('2026-08-31T11:00:00.000Z'),
      );

    beforeAll(async () => {
  await prisma.booking.deleteMany({
    where: {
      resourceId,
    },
  });

  await prisma.blackoutPeriod.deleteMany({
    where: {
      resourceId,
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
      name: 'Integration Room',
      description: 'Resource used by integration tests',
      capacity: 4,
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
    });

   afterAll(async () => {
  await prisma.booking.deleteMany({
    where: {
      resourceId,
    },
  });

  await prisma.blackoutPeriod.deleteMany({
    where: {
      resourceId,
    },
  });

  await prisma.resource.deleteMany({
    where: {
      id: resourceId,
    },
  });

  await prisma.$disconnect();
});



    it('persists and retrieves an active booking', async () => {
      const booking = Booking.create({
        id: 'integration-booking-1',
        resourceId,
        customerId: 'integration-customer-1',
        period: createPeriod(),
      });

      booking.confirm();

      await repository.save(booking);

      const bookings =
        await repository.findActiveByResourceId(resourceId);

      expect(bookings).toHaveLength(1);
      expect(bookings[0]?.id).toBe('integration-booking-1');
      expect(bookings[0]?.resourceId).toBe(resourceId);
      expect(bookings[0]?.customerId).toBe(
        'integration-customer-1',
      );
      expect(bookings[0]?.currentStatus).toBe('CONFIRMED');
      expect(bookings[0]?.period.startsAt.toISOString()).toBe(
        '2026-08-31T10:00:00.000Z',
      );
      expect(bookings[0]?.period.endsAt.toISOString()).toBe(
        '2026-08-31T11:00:00.000Z',
      );
    });

    it('does not return cancelled bookings as active', async () => {
      const booking = Booking.create({
        id: 'integration-booking-2',
        resourceId,
        customerId: 'integration-customer-2',
        period: createPeriod(),
      });

      booking.confirm();
      booking.cancel();

      await prisma.booking.create({
        data: {
          id: booking.id,
          resourceId: booking.resourceId,
          customerId: booking.customerId,
          startsAt: booking.period.startsAt,
          endsAt: booking.period.endsAt,
          status: 'CANCELLED',
          createdAt: booking.createdAt,
        },
      });

      const bookings =
        await repository.findActiveByResourceId(resourceId);

      expect(bookings).toHaveLength(0);
    });
  },
);
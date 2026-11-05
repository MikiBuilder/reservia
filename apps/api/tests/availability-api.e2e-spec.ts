import { randomUUID } from 'node:crypto';

import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { AppModule } from '../src/app.module.js';

const integrationTestsEnabled =
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)(
  'Availability API E2E',
  () => {
    let app: INestApplication;

    const prisma = new PrismaClient();

    const resourceId = 'e2e-availability-resource-1';
    const password = 'Sala-Mediterranea-2026';
    const customerEmail =
      `availability-${randomUUID()}@example.com`;

    const monday = '2026-08-31';
    const sunday = '2026-08-30';

    const formatSlot = (slot: {
      startsAt: string;
      endsAt: string;
    }): string =>
      `${slot.startsAt.slice(11, 16)}-${slot.endsAt.slice(11, 16)}`;

    beforeAll(async () => {
      await prisma.booking.deleteMany({
        where: { resourceId },
      });

      await prisma.outboxMessage.deleteMany({
        where: {
          aggregateId: {
            startsWith: 'e2e-availability-',
          },
        },
      });

      await prisma.idempotencyRecord.deleteMany({
        where: {
          operation: 'CreateBooking',
        },
      });

      await prisma.resourceBusinessHours.deleteMany({
        where: { resourceId },
      });

      await prisma.resource.deleteMany({
        where: { id: resourceId },
      });

      await prisma.user.deleteMany({
        where: { email: customerEmail },
      });

      await prisma.resource.create({
        data: {
          id: resourceId,
          name: 'E2E Availability Room',
          description: 'Resource for availability API tests',
          capacity: 8,
          status: 'ACTIVE',
        },
      });

      await prisma.resourceBusinessHours.create({
        data: {
          id: 'e2e-availability-hours-1',
          resourceId,
          schedule: {
            MONDAY: {
              opensAt: '08:00',
              closesAt: '20:00',
            },
          },
        },
      });

      process.env.JWT_SECRET ??=
        'secret-de-e2e-tests-con-mas-de-32-caracteres';
      process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ??= '900';

      const moduleRef =
        await Test.createTestingModule({
          imports: [AppModule],
        }).compile();

      app = moduleRef.createNestApplication();

      app.setGlobalPrefix('api');

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      await app.init();
    });

    beforeEach(async () => {
      await prisma.booking.deleteMany({
        where: { resourceId },
      });

      await prisma.outboxMessage.deleteMany({
        where: {
          aggregateId: {
            startsWith: 'e2e-availability-',
          },
        },
      });

      await prisma.idempotencyRecord.deleteMany({
        where: {
          operation: 'CreateBooking',
        },
      });
    });

    afterAll(async () => {
      await prisma.booking.deleteMany({
        where: { resourceId },
      });

      await prisma.outboxMessage.deleteMany({
        where: {
          aggregateId: {
            startsWith: 'e2e-availability-',
          },
        },
      });

      await prisma.idempotencyRecord.deleteMany({
        where: {
          operation: 'CreateBooking',
        },
      });

      await prisma.resourceBusinessHours.deleteMany({
        where: { resourceId },
      });

      await prisma.resource.deleteMany({
        where: { id: resourceId },
      });

      await prisma.user.deleteMany({
        where: { email: customerEmail },
      });

      await prisma.$disconnect();

      if (app) {
        await app.close();
      }
    });

    it('returns the weekly hours and the free slots of the day', async () => {
      const response = await request(
        app.getHttpServer(),
      ).get(
        `/api/resources/${resourceId}/availability?date=${monday}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.resourceId).toBe(
        resourceId,
      );
      expect(response.body.data.date).toBe(monday);
      expect(response.body.data.businessHours).toEqual([
        {
          day: 'MONDAY',
          opensAt: '08:00',
          closesAt: '20:00',
        },
      ]);

      const slots = response.body.data.availableSlots;

      expect(slots).toHaveLength(12);
      expect(slots[0]).toEqual({
        startsAt: '2026-08-31T08:00:00.000Z',
        endsAt: '2026-08-31T09:00:00.000Z',
      });
      expect(slots[11]).toEqual({
        startsAt: '2026-08-31T19:00:00.000Z',
        endsAt: '2026-08-31T20:00:00.000Z',
      });
    });

    it('excludes the slots that are already booked', async () => {
      const registered = await request(
        app.getHttpServer(),
      )
        .post('/api/auth/register')
        .send({
          email: customerEmail,
          password,
          name: 'Marta Ferrer',
        });

      expect(registered.status).toBe(201);

      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: customerEmail,
          password,
        });

      expect(login.status).toBe(200);

      const booking = await request(app.getHttpServer())
        .post('/api/bookings')
        .set(
          'Authorization',
          `Bearer ${login.body.data.accessToken}`,
        )
        .set(
          'Idempotency-Key',
          'e2e-availability-key-1',
        )
        .send({
          id: 'e2e-availability-booking-1',
          resourceId,
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      expect(booking.status).toBe(201);

      const response = await request(
        app.getHttpServer(),
      ).get(
        `/api/resources/${resourceId}/availability?date=${monday}`,
      );

      const slots = response.body.data.availableSlots.map(
        formatSlot,
      );

      expect(slots).toHaveLength(11);
      expect(slots).not.toContain('10:00-11:00');
    });

    it('returns no slots on a closed day', async () => {
      const response = await request(
        app.getHttpServer(),
      ).get(
        `/api/resources/${resourceId}/availability?date=${sunday}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.availableSlots).toEqual([]);
    });

    it('returns 404 for an unknown resource', async () => {
      const response = await request(
        app.getHttpServer(),
      ).get(
        '/api/resources/recurso-inexistente/availability',
      );

      expect(response.status).toBe(404);
    });

    it('rejects an invalid date', async () => {
      const response = await request(
        app.getHttpServer(),
      ).get(
        `/api/resources/${resourceId}/availability?date=no-es-una-fecha`,
      );

      expect(response.status).toBe(400);
    });
  },
);
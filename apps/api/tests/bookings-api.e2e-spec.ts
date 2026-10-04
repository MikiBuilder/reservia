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
  'Bookings API E2E',
  () => {
    let app: INestApplication;
    const prisma = new PrismaClient();

    const resourceId = 'e2e-booking-resource-1';

    beforeAll(async () => {
      await prisma.booking.deleteMany({
        where: { resourceId },
      });

      await prisma.outboxMessage.deleteMany({
        where: {
          aggregateId: {
            startsWith: 'e2e-booking-',
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

      await prisma.resource.create({
        data: {
          id: resourceId,
          name: 'E2E Booking Room',
          description: 'Resource for booking API tests',
          capacity: 8,
          status: 'ACTIVE',
        },
      });

      await prisma.resourceBusinessHours.create({
        data: {
          id: 'e2e-booking-hours-1',
          resourceId,
          schedule: {
            MONDAY: {
              opensAt: '08:00',
              closesAt: '20:00',
            },
          },
        },
      });

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
            startsWith: 'e2e-booking-',
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
            startsWith: 'e2e-booking-',
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

      await prisma.$disconnect();

      if (app) {
        await app.close();
      }
    });

    it('creates a valid booking', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set(
          'Idempotency-Key',
          'e2e-booking-key-1',
        )
        .send({
          id: 'e2e-booking-1',
          resourceId,
          customerId: 'e2e-customer-1',
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        id: 'e2e-booking-1',
        resourceId,
        customerId: 'e2e-customer-1',
        status: 'CONFIRMED',
      });
    });

    it('does not duplicate a booking on retry', async () => {
      const requestBody = {
        id: 'e2e-booking-2',
        resourceId,
        customerId: 'e2e-customer-2',
        startsAt: '2026-08-31T12:00:00.000Z',
        endsAt: '2026-08-31T13:00:00.000Z',
      };

      const firstResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set(
          'Idempotency-Key',
          'e2e-booking-key-2',
        )
        .send(requestBody);

      const secondResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set(
          'Idempotency-Key',
          'e2e-booking-key-2',
        )
        .send({
          ...requestBody,
          id: 'e2e-booking-duplicated',
        });

      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(201);
      expect(secondResponse.body.data.id).toBe(
        'e2e-booking-2',
      );

      const bookings =
        await prisma.booking.findMany({
          where: { resourceId },
        });

      expect(bookings).toHaveLength(1);
    });

    it('rejects an overlapping booking', async () => {
      await request(app.getHttpServer())
        .post('/api/bookings')
        .set(
          'Idempotency-Key',
          'e2e-booking-key-3',
        )
        .send({
          id: 'e2e-booking-3',
          resourceId,
          customerId: 'e2e-customer-3',
          startsAt: '2026-08-31T14:00:00.000Z',
          endsAt: '2026-08-31T15:00:00.000Z',
        });

      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set(
          'Idempotency-Key',
          'e2e-booking-key-4',
        )
        .send({
          id: 'e2e-booking-4',
          resourceId,
          customerId: 'e2e-customer-4',
          startsAt: '2026-08-31T14:30:00.000Z',
          endsAt: '2026-08-31T15:30:00.000Z',
        });

      expect(response.status).toBe(409);
    });

    it('requires the Idempotency-Key header', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .send({
          id: 'e2e-booking-5',
          resourceId,
          customerId: 'e2e-customer-5',
          startsAt: '2026-08-31T16:00:00.000Z',
          endsAt: '2026-08-31T17:00:00.000Z',
        });

      expect(response.status).toBe(409);
    });
  },
);
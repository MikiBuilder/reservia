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
  'Bookings API E2E',
  () => {
    let app: INestApplication;
    let customerToken: string;
    let customerId: string;

    const prisma = new PrismaClient();

    const resourceId = 'e2e-booking-resource-1';
    const password = 'Sala-Mediterranea-2026';

    const customerEmail =
      `booking-customer-${randomUUID()}@example.com`;
    const otherEmail =
      `booking-other-${randomUUID()}@example.com`;
    const adminEmail =
      `booking-admin-${randomUUID()}@example.com`;

    const deleteRegisteredUsers = async (): Promise<void> => {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [customerEmail, otherEmail, adminEmail],
          },
        },
      });
    };

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

      await deleteRegisteredUsers();

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
      customerId = registered.body.data.id;

      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: customerEmail,
          password,
        });

      expect(login.status).toBe(200);
      customerToken = login.body.data.accessToken;
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

      await deleteRegisteredUsers();

      await prisma.$disconnect();

      if (app) {
        await app.close();
      }
    });

    it('creates a valid booking for the authenticated customer', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .set(
          'Idempotency-Key',
          'e2e-booking-key-1',
        )
        .send({
          id: 'e2e-booking-1',
          resourceId,
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        id: 'e2e-booking-1',
        resourceId,
        customerId,
        status: 'CONFIRMED',
      });
    });

    it('does not duplicate a booking on retry', async () => {
      const requestBody = {
        id: 'e2e-booking-2',
        resourceId,
        startsAt: '2026-08-31T12:00:00.000Z',
        endsAt: '2026-08-31T13:00:00.000Z',
      };

      const firstResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .set(
          'Idempotency-Key',
          'e2e-booking-key-2',
        )
        .send(requestBody);

      const secondResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
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
      expect(secondResponse.body.data.customerId).toBe(
        customerId,
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
        .set('Authorization', `Bearer ${customerToken}`)
        .set(
          'Idempotency-Key',
          'e2e-booking-key-3',
        )
        .send({
          id: 'e2e-booking-3',
          resourceId,
          startsAt: '2026-08-31T14:00:00.000Z',
          endsAt: '2026-08-31T15:00:00.000Z',
        });

      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .set(
          'Idempotency-Key',
          'e2e-booking-key-4',
        )
        .send({
          id: 'e2e-booking-4',
          resourceId,
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
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          id: 'e2e-booking-5',
          resourceId,
          startsAt: '2026-08-31T16:00:00.000Z',
          endsAt: '2026-08-31T17:00:00.000Z',
        });

      expect(response.status).toBe(409);
    });

    it('rejects a request without a token', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set(
          'Idempotency-Key',
          'e2e-booking-key-6',
        )
        .send({
          id: 'e2e-booking-6',
          resourceId,
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'Access token is required',
      );
    });

    it('rejects a request with an invalid token', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set(
          'Authorization',
          'Bearer esto-no-es-un-jwt',
        )
        .set(
          'Idempotency-Key',
          'e2e-booking-key-7',
        )
        .send({
          id: 'e2e-booking-7',
          resourceId,
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'Access token is not valid',
      );
    });

    it('rejects a user without the CUSTOMER role', async () => {
      const registered = await request(
        app.getHttpServer(),
      )
        .post('/api/auth/register')
        .send({
          email: adminEmail,
          password,
          name: 'Gestión Reservia',
        });

      expect(registered.status).toBe(201);

      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' },
      });

      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: adminEmail,
          password,
        });

      expect(login.status).toBe(200);

      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set(
          'Authorization',
          `Bearer ${login.body.data.accessToken}`,
        )
        .set(
          'Idempotency-Key',
          'e2e-booking-key-8',
        )
        .send({
          id: 'e2e-booking-8',
          resourceId,
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'Insufficient role',
      );
    });

    it('rejects a customerId sent in the body', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .set(
          'Idempotency-Key',
          'e2e-booking-key-9',
        )
        .send({
          id: 'e2e-booking-9',
          resourceId,
          customerId: 'cualquier-cosa',
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).toContain(
        'customerId',
      );

      const bookings =
        await prisma.booking.findMany({
          where: { resourceId },
        });

      expect(bookings).toHaveLength(0);
    });

    it('rejects the same idempotency key used by another user', async () => {
      const registered = await request(
        app.getHttpServer(),
      )
        .post('/api/auth/register')
        .send({
          email: otherEmail,
          password,
          name: 'Otra Persona',
        });

      expect(registered.status).toBe(201);

      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: otherEmail,
          password,
        });

      expect(login.status).toBe(200);

      const firstResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .set(
          'Idempotency-Key',
          'e2e-booking-key-shared',
        )
        .send({
          id: 'e2e-booking-shared-1',
          resourceId,
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      const secondResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/bookings')
        .set(
          'Authorization',
          `Bearer ${login.body.data.accessToken}`,
        )
        .set(
          'Idempotency-Key',
          'e2e-booking-key-shared',
        )
        .send({
          id: 'e2e-booking-shared-2',
          resourceId,
          startsAt: '2026-08-31T10:00:00.000Z',
          endsAt: '2026-08-31T11:00:00.000Z',
        });

      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.message).toBe(
        'Idempotency key was already used with different data',
      );
    });
  },
);
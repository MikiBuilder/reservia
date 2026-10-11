import { randomUUID } from 'node:crypto';

import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

const integrationTestsEnabled =
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)(
  'Auth API E2E',
  () => {
    let app: INestApplication;

    const prisma = new PrismaClient();

    const password = 'Sala-Mediterranea-2026';

    const email = `registro-${randomUUID()}@example.com`;
    const duplicatedEmail = `duplicado-${randomUUID()}@example.com`;
    const raceEmail = `carrera-${randomUUID()}@example.com`;

    const deleteRegisteredUsers = async (): Promise<void> => {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [email, duplicatedEmail, raceEmail],
          },
        },
      });
    };

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
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

      await deleteRegisteredUsers();
    });

    afterAll(async () => {
      await deleteRegisteredUsers();
      await prisma.$disconnect();
      await app.close();
    });

    it('POST /api/auth/register creates a customer account', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `  ${email.toUpperCase()}  `,
          password,
          name: 'Marta Ferrer',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        email,
        name: 'Marta Ferrer',
        status: 'ACTIVE',
        role: 'CUSTOMER',
      });
      expect(response.body.data).not.toHaveProperty(
        'passwordHash',
      );
      expect(JSON.stringify(response.body)).not.toContain(
        'password',
      );
    });

    it('POST /api/auth/register rejects a duplicated email', async () => {
      const first = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: duplicatedEmail,
          password,
          name: 'Marta Ferrer',
        });

      expect(first.status).toBe(201);

      const second = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: duplicatedEmail,
          password,
          name: 'Otra Persona',
        });

      expect(second.status).toBe(409);
    });

    it('POST /api/auth/register rejects an invalid payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'no-es-un-email',
          password: 'corta',
          name: '',
        });

      expect(response.status).toBe(400);
    });

    it('POST /api/auth/register resolves a simultaneous registration with a single account', async () => {
      const [first, second] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: raceEmail,
            password,
            name: 'Primera',
          }),
        request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: raceEmail,
            password,
            name: 'Segunda',
          }),
      ]);

      const statuses = [first.status, second.status].sort();

      expect(statuses).toEqual([201, 409]);

      const users = await prisma.user.findMany({
        where: {
          email: raceEmail,
        },
      });

      expect(users).toHaveLength(1);
    });
  },
);
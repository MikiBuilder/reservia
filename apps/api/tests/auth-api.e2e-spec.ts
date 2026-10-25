import { randomUUID } from 'node:crypto';

import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    const loginEmail = `login-${randomUUID()}@example.com`;
    const wrongEmail = `clave-mala-${randomUUID()}@example.com`;
    const lockedEmail = `bloqueada-${randomUUID()}@example.com`;
    const meEmail = `me-${randomUUID()}@example.com`;

    const deleteRegisteredUsers = async (): Promise<void> => {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              email,
              duplicatedEmail,
              raceEmail,
              loginEmail,
              wrongEmail,
              lockedEmail,
              meEmail,
            ],
          },
        },
      });
    };

    beforeAll(async () => {
      process.env.JWT_SECRET ??=
        'secret-de-e2e-tests-con-mas-de-32-caracteres';
      process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ??= '900';

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

    it('POST /api/auth/login issues a bearer token', async () => {
      const registered = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: loginEmail,
          password,
          name: 'Marta Ferrer',
        });

      expect(registered.status).toBe(201);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `  ${loginEmail.toUpperCase()}  `,
          password,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 900,
      });
      expect(response.body.data.accessToken.split('.')).toHaveLength(3);
      expect(response.body.data.user).toEqual(registered.body.data);
      expect(JSON.stringify(response.body.data.user)).not.toContain(
        'password',
      );

      const [, payloadSegment] =
        response.body.data.accessToken.split('.');
      const claims = JSON.parse(
        Buffer.from(payloadSegment, 'base64url').toString(),
      );

      expect(claims.sub).toBe(registered.body.data.id);
      expect(claims.email).toBe(loginEmail);
      expect(claims.role).toBe('CUSTOMER');
      expect(Object.keys(claims).sort()).toEqual([
        'email',
        'exp',
        'iat',
        'role',
        'sub',
      ]);
    });

    it('POST /api/auth/login hides whether the account exists', async () => {
      const registered = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: wrongEmail,
          password,
          name: 'Marta Ferrer',
        });

      expect(registered.status).toBe(201);

      const unknownEmail = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `desconocida-${randomUUID()}@example.com`,
          password,
        });

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: wrongEmail,
          password: 'otra-clave-2026',
        });

      const malformedEmail = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'esto-no-es-un-email',
          password,
        });

      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.status).toBe(401);
      expect(malformedEmail.status).toBe(401);

      expect(unknownEmail.body).toEqual(wrongPassword.body);
      expect(unknownEmail.body).toEqual(malformedEmail.body);
      expect(unknownEmail.body.message).toBe('Invalid credentials');
    });

    it('POST /api/auth/login checks the password before the account status', async () => {
      const registered = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: lockedEmail,
          password,
          name: 'Marta Ferrer',
        });

      expect(registered.status).toBe(201);

      await prisma.user.update({
        where: { email: lockedEmail },
        data: { status: 'LOCKED' },
      });

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: lockedEmail,
          password: 'otra-clave-2026',
        });

      expect(wrongPassword.status).toBe(401);
      expect(wrongPassword.body.message).toBe('Invalid credentials');

      const rightPassword = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: lockedEmail,
          password,
        });

      expect(rightPassword.status).toBe(403);
      expect(rightPassword.body.message).toBe(
        'Account is not active',
      );
    });

    it('POST /api/auth/login rejects an incomplete payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'cualquiera@example.com' });

      expect(response.status).toBe(400);
    });

    const authenticate = async (
      userEmail: string,
    ): Promise<{ accessToken: string; userId: string }> => {
      const registered = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: userEmail,
          password,
          name: 'Marta Ferrer',
        });

      expect(registered.status).toBe(201);

      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password,
        });

      expect(login.status).toBe(200);

      return {
        accessToken: login.body.data.accessToken,
        userId: registered.body.data.id,
      };
    };

    it('GET /api/auth/me returns the token subject', async () => {
      const { accessToken, userId } = await authenticate(meEmail);

      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        id: userId,
        email: meEmail,
        role: 'CUSTOMER',
      });
    });

    it('GET /api/auth/me rejects requests without a bearer token', async () => {
      const missing = await request(app.getHttpServer()).get(
        '/api/auth/me',
      );

      expect(missing.status).toBe(401);
      expect(missing.body.message).toBe('Access token is required');

      const wrongScheme = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Basic abc123');

      expect(wrongScheme.status).toBe(401);
      expect(wrongScheme.body.message).toBe(
        'Access token is required',
      );
    });

    it('GET /api/auth/me rejects a token that is not valid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer esto-no-es-un-jwt');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'Access token is not valid',
      );
    });

    it('GET /api/auth/me rejects an expired token', async () => {
      const jwtService = new JwtService({
        secret:process.env.JWT_SECRET ?? 'secret-de-e2e-tests-con-mas-de-32-caracteres',
      });

      const expiredToken = jwtService.sign({
        sub: 'user-expired',
        email: `caducada-${randomUUID()}@example.com`,
        role: 'CUSTOMER',
        exp: Math.floor(Date.now() / 1000) - 60,
      });

      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'Access token has expired',
      );
    });
  },
);
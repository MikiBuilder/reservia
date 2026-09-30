import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

const integrationTestsEnabled =
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)(
  'Reservia API E2E',
  () => {
    let app: INestApplication;

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
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /api/health returns the application status', async () => {
      const response = await request(
        app.getHttpServer(),
      ).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'reservia-api',
      });
      expect(response.body.timestamp).toEqual(
        expect.any(String),
      );
    });

    it('GET /api/resources returns resources', async () => {
      const response = await request(
        app.getHttpServer(),
      ).get('/api/resources');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/resources/:id returns a resource', async () => {
      const response = await request(
        app.getHttpServer(),
      ).get('/api/resources/demo-resource-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        id: 'demo-resource-1',
      });
    });

    it('GET /api/resources/:id returns 404 for an unknown resource', async () => {
      const response = await request(
        app.getHttpServer(),
      ).get('/api/resources/resource-does-not-exist');

      expect(response.status).toBe(404);
    });
  },
);
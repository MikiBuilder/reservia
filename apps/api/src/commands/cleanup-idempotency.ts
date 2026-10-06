import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { CleanupExpiredIdempotency } from '../modules/bookings/application/cleanup-expired-idempotency.js';
import { PrismaIdempotencyRepository } from '../modules/bookings/infrastructure/prisma-idempotency-repository.js';
import { PrismaService } from '../database/prisma.service.js';

async function bootstrap(): Promise<void> {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
    );

  try {
    const prisma = app.get(PrismaService);
    const repository =
      new PrismaIdempotencyRepository(prisma);

    const cleanup =
      new CleanupExpiredIdempotency(repository);

    const result = await cleanup.execute();

    console.log(
      JSON.stringify(
        {
          message:
            'Expired idempotency cleanup completed',
          ...result,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

void bootstrap();
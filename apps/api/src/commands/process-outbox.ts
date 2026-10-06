import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { ProcessOutboxMessages } from '../modules/bookings/application/process-outbox-messages.js';

async function bootstrap(): Promise<void> {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
    );

  try {
    const processor =
      app.get(ProcessOutboxMessages);

    const result = await processor.execute(50);

    console.log(
      JSON.stringify(
        {
          message: 'Outbox processing completed',
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
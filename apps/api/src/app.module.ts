import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResourcesModule } from './modules/resources/presentation/resources.module.js';
import { BookingsModule } from './modules/bookings/presentation/bookings.module.js';
import { IdentityModule } from './modules/identity/presentation/identity.module.js';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    ResourcesModule,
    BookingsModule,
    IdentityModule,
  ],
})
export class AppModule {}
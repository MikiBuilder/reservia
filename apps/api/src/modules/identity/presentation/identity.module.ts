import { Module } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service.js';

import { IdGenerator } from '../../../shared/application/id-generator.js';
import { UuidIdGenerator } from '../../../shared/infrastructure/uuid-id-generator.js';

import { PasswordHasher } from '../application/password-hasher.js';
import { RegisterUser } from '../application/register-user.js';
import { UserRepository } from '../application/user-repository.js';

import { PasswordPolicy } from '../domain/password-policy.js';

import { Argon2PasswordHasher } from '../infrastructure/argon2-password-hasher.js';
import { PrismaUserRepository } from '../infrastructure/prisma-user-repository.js';

import { AuthController } from './auth.controller.js';

@Module({
  controllers: [AuthController],
  providers: [
    PrismaService,
    PasswordPolicy,
    {
      provide: 'UserRepository',
      useFactory: (
        prisma: PrismaService,
      ): UserRepository => new PrismaUserRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'PasswordHasher',
      useFactory: (): PasswordHasher =>
        new Argon2PasswordHasher(),
    },
    {
      provide: 'IdGenerator',
      useFactory: (): IdGenerator => new UuidIdGenerator(),
    },
    {
      provide: RegisterUser,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        passwordPolicy: PasswordPolicy,
        idGenerator: IdGenerator,
      ) =>
        new RegisterUser(
          userRepository,
          passwordHasher,
          passwordPolicy,
          idGenerator,
        ),
      inject: [
        'UserRepository',
        'PasswordHasher',
        PasswordPolicy,
        'IdGenerator',
      ],
    },
  ],
})
export class IdentityModule {}
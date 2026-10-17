import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../../database/prisma.service.js';

import { IdGenerator } from '../../../shared/application/id-generator.js';
import { UuidIdGenerator } from '../../../shared/infrastructure/uuid-id-generator.js';

import { AccessTokenIssuer } from '../application/access-token-issuer.js';
import { AuthenticateUser } from '../application/authenticate-user.js';
import { PasswordHasher } from '../application/password-hasher.js';
import { RegisterUser } from '../application/register-user.js';
import { UserRepository } from '../application/user-repository.js';

import { PasswordPolicy } from '../domain/password-policy.js';

import { Argon2PasswordHasher } from '../infrastructure/argon2-password-hasher.js';
import { JwtAccessTokenIssuer } from '../infrastructure/jwt-access-token-issuer.js';
import { PrismaUserRepository } from '../infrastructure/prisma-user-repository.js';

import { AuthController } from './auth.controller.js';

export function readJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be defined with at least 32 characters');
  }

  return secret;
}

export function readAccessTokenTtlSeconds(): number {
  const raw = process.env.JWT_ACCESS_TOKEN_TTL_SECONDS;
  const ttl = Number(raw);

  if (raw === undefined || !Number.isInteger(ttl) || ttl <= 0) {
    throw new Error('JWT_ACCESS_TOKEN_TTL_SECONDS must be a positive integer');
  }

  return ttl;
}

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: readJwtSecret(),
        signOptions: { expiresIn: readAccessTokenTtlSeconds() },
      }),
    }),
  ],
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
      provide: 'AccessTokenIssuer',
      useFactory: (
        jwtService: JwtService,
      ): AccessTokenIssuer =>
        new JwtAccessTokenIssuer(jwtService, readAccessTokenTtlSeconds()),
      inject: [JwtService],
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
    {
      provide: AuthenticateUser,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        accessTokenIssuer: AccessTokenIssuer,
      ) =>
        new AuthenticateUser(
          userRepository,
          passwordHasher,
          accessTokenIssuer,
        ),
      inject: ['UserRepository', 'PasswordHasher', 'AccessTokenIssuer'],
    },
  ],
})
export class IdentityModule {}
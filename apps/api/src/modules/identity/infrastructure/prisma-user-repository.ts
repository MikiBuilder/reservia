import { Prisma, PrismaClient } from '@prisma/client';

import { UserRepository } from '../application/user-repository.js';
import { Email } from '../domain/email.js';
import { User } from '../domain/user.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.value },
    });

    if (!record) {
      return null;
    }

    return User.rehydrate({
      id: record.id,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      name: record.name,
      status: record.status,
      role: record.role,
      createdAt: record.createdAt,
    });
  }

  async save(user: User): Promise<void> {
    try {
      await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email.value,
          passwordHash: user.passwordHash,
          name: user.name,
          status: user.currentStatus,
          role: user.currentRole,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new Error('EMAIL_ALREADY_REGISTERED');
      }

      throw error;
    }
  }
}
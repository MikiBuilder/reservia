import { PrismaClient } from '@prisma/client';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { Email } from '../src/modules/identity/domain/email.js';
import { User } from '../src/modules/identity/domain/user.js';
import { PrismaUserRepository } from '../src/modules/identity/infrastructure/prisma-user-repository.js';

const integrationTestsEnabled =
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)(
  'PrismaUserRepository integration',
  () => {
    const prisma = new PrismaClient();
    const repository = new PrismaUserRepository(prisma);

    const emailDomain = '@integration.test';

    const deleteIntegrationUsers = async (): Promise<void> => {
      await prisma.user.deleteMany({
        where: {
          email: {
            endsWith: emailDomain,
          },
        },
      });
    };

    const createUser = (params: {
      id: string;
      email: string;
    }): User =>
      User.create({
        id: params.id,
        email: Email.create(params.email),
        passwordHash: 'insecure-test-hash:abc',
        name: 'Integration User',
      });

    beforeAll(async () => {
      await deleteIntegrationUsers();
    });

    beforeEach(async () => {
      await deleteIntegrationUsers();
    });

    afterAll(async () => {
      await deleteIntegrationUsers();
      await prisma.$disconnect();
    });

    it('persists and finds a user by email', async () => {
      await repository.save(
        createUser({
          id: 'integration-user-1',
          email: 'marta@integration.test',
        }),
      );

      const found = await repository.findByEmail(
        Email.create('MARTA@integration.test'),
      );

      expect(found).not.toBeNull();
      expect(found?.id).toBe('integration-user-1');
      expect(found?.email.value).toBe('marta@integration.test');
      expect(found?.currentStatus).toBe('ACTIVE');
      expect(found?.currentRole).toBe('CUSTOMER');
      expect(found?.isActive()).toBe(true);
    });

    it('returns null when the email is not registered', async () => {
      const found = await repository.findByEmail(
        Email.create('nadie@integration.test'),
      );

      expect(found).toBeNull();
    });

    it('rejects a duplicated email with EMAIL_ALREADY_REGISTERED', async () => {
      await repository.save(
        createUser({
          id: 'integration-user-2',
          email: 'duplicada@integration.test',
        }),
      );

      await expect(
        repository.save(
          createUser({
            id: 'integration-user-3',
            email: 'duplicada@integration.test',
          }),
        ),
      ).rejects.toThrow('EMAIL_ALREADY_REGISTERED');

      const users = await prisma.user.findMany({
        where: {
          email: 'duplicada@integration.test',
        },
      });

      expect(users).toHaveLength(1);
    });
  },
);
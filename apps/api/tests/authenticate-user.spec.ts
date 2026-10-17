import { describe, expect, it } from 'vitest';

import { AuthenticateUser } from '../src/modules/identity/application/authenticate-user.js';
import { Email } from '../src/modules/identity/domain/email.js';
import {
  User,
  UserRole,
  UserStatus,
} from '../src/modules/identity/domain/user.js';

import { InMemoryAccessTokenIssuer } from './in-memory-access-token-issuer.js';
import { InMemoryPasswordHasher } from './in-memory-password-hasher.js';
import { InMemoryUserRepository } from './in-memory-user-repository.js';

const password = 'Sala-Mediterranea-2026';

interface Scenario {
  userRepository: InMemoryUserRepository;
  passwordHasher: InMemoryPasswordHasher;
  accessTokenIssuer: InMemoryAccessTokenIssuer;
  authenticateUser: AuthenticateUser;
}

function createScenario(): Scenario {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new InMemoryPasswordHasher();
  const accessTokenIssuer = new InMemoryAccessTokenIssuer();

  return {
    userRepository,
    passwordHasher,
    accessTokenIssuer,
    authenticateUser: new AuthenticateUser(
      userRepository,
      passwordHasher,
      accessTokenIssuer,
    ),
  };
}

async function seedUser(
  scenario: Scenario,
  params: {
    id: string;
    email: string;
    password: string;
    status?: UserStatus;
    role?: UserRole;
  },
): Promise<User> {
  const user = User.rehydrate({
    id: params.id,
    email: Email.create(params.email),
    passwordHash: await scenario.passwordHasher.hash(params.password),
    name: 'Marta Ferrer',
    status: params.status ?? 'ACTIVE',
    role: params.role ?? 'CUSTOMER',
    createdAt: new Date('2026-10-11T17:27:39.716Z'),
  });

  await scenario.userRepository.save(user);

  return user;
}

describe('AuthenticateUser', () => {
  it('issues a token and returns the user for valid credentials', async () => {
    const scenario = createScenario();
    const user = await seedUser(scenario, {
      id: 'user-1',
      email: 'marta@example.com',
      password,
    });

    const result = await scenario.authenticateUser.execute({
      email: '  MARTA@example.com  ',
      password,
    });

    expect(result.accessToken).toBe('token-for-user-1');
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(900);
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'marta@example.com',
      name: 'Marta Ferrer',
      status: 'ACTIVE',
      role: 'CUSTOMER',
      createdAt: user.createdAt,
    });
    expect(scenario.accessTokenIssuer.issuedClaims).toEqual([
      {
        subject: 'user-1',
        email: 'marta@example.com',
        role: 'CUSTOMER',
      },
    ]);
  });

  it('rejects an unknown email but still verifies a password', async () => {
    const scenario = createScenario();

    await expect(
      scenario.authenticateUser.execute({
        email: 'desconocida@example.com',
        password,
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS');

    expect(scenario.passwordHasher.verifyCount).toBe(1);
    expect(scenario.passwordHasher.hashCount).toBe(1);
    expect(scenario.accessTokenIssuer.issuedClaims).toHaveLength(0);
  });

  it('reuses the dummy password hash across unknown emails', async () => {
    const scenario = createScenario();

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await expect(
        scenario.authenticateUser.execute({
          email: `desconocida-${attempt}@example.com`,
          password,
        }),
      ).rejects.toThrow('INVALID_CREDENTIALS');
    }

    expect(scenario.passwordHasher.hashCount).toBe(1);
    expect(scenario.passwordHasher.verifyCount).toBe(3);
  });

  it('rejects a wrong password', async () => {
    const scenario = createScenario();
    await seedUser(scenario, {
      id: 'user-1',
      email: 'marta@example.com',
      password,
    });

    await expect(
      scenario.authenticateUser.execute({
        email: 'marta@example.com',
        password: 'clave-que-no-es',
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS');

    expect(scenario.passwordHasher.verifyCount).toBe(1);
    expect(scenario.accessTokenIssuer.issuedClaims).toHaveLength(0);
  });

  it('treats a malformed email as invalid credentials', async () => {
    const scenario = createScenario();

    await expect(
      scenario.authenticateUser.execute({
        email: 'esto-no-es-un-email',
        password,
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS');

    expect(scenario.passwordHasher.verifyCount).toBe(0);
    expect(scenario.accessTokenIssuer.issuedClaims).toHaveLength(0);
  });

  it('rejects a command with missing or empty fields', async () => {
    const scenario = createScenario();

    await expect(
      scenario.authenticateUser.execute({
        email: 'marta@example.com',
        password: '',
      }),
    ).rejects.toThrow('INVALID_LOGIN_REQUEST');

    await expect(
      scenario.authenticateUser.execute({
        email: '',
        password,
      }),
    ).rejects.toThrow('INVALID_LOGIN_REQUEST');

    await expect(
      scenario.authenticateUser.execute({
        email: '   ',
        password,
      }),
    ).rejects.toThrow('INVALID_LOGIN_REQUEST');

    expect(scenario.passwordHasher.hashCount).toBe(0);
    expect(scenario.passwordHasher.verifyCount).toBe(0);
    expect(scenario.accessTokenIssuer.issuedClaims).toHaveLength(0);
  });

  it('checks the password before the account status', async () => {
    const scenario = createScenario();
    await seedUser(scenario, {
      id: 'user-1',
      email: 'bloqueada@example.com',
      password,
      status: 'LOCKED',
    });

    await expect(
      scenario.authenticateUser.execute({
        email: 'bloqueada@example.com',
        password: 'clave-que-no-es',
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS');

    await expect(
      scenario.authenticateUser.execute({
        email: 'bloqueada@example.com',
        password,
      }),
    ).rejects.toThrow('USER_NOT_ACTIVE');

    expect(scenario.passwordHasher.verifyCount).toBe(2);
    expect(scenario.accessTokenIssuer.issuedClaims).toHaveLength(0);
  });
});
import { describe, expect, it } from 'vitest';

import { RegisterUser } from '../src/modules/identity/application/register-user.js';
import { PasswordPolicy } from '../src/modules/identity/domain/password-policy.js';

import { InMemoryIdGenerator } from './in-memory-id-generator.js';
import { InMemoryPasswordHasher } from './in-memory-password-hasher.js';
import { InMemoryUserRepository } from './in-memory-user-repository.js';

const createUseCase = () => {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new InMemoryPasswordHasher();

  const useCase = new RegisterUser(
    userRepository,
    passwordHasher,
    new PasswordPolicy(),
    new InMemoryIdGenerator(),
  );

  return {
    useCase,
    userRepository,
    passwordHasher,
  };
};

const validRegistration = {
  email: 'Marta@Example.com',
  password: 'Sala-Mediterranea-2026',
  name: 'Marta Ferrer',
};

describe('RegisterUser', () => {
  it('registers an active customer with a hashed password', async () => {
    const { useCase, userRepository } = createUseCase();

    const user = await useCase.execute(validRegistration);

    expect(user.id).toBe('generated-id-1');
    expect(user.email.value).toBe('marta@example.com');
    expect(user.name).toBe('Marta Ferrer');
    expect(user.currentStatus).toBe('ACTIVE');
    expect(user.currentRole).toBe('CUSTOMER');
    expect(user.passwordHash).not.toContain(
      validRegistration.password,
    );
    expect(user.passwordHash.startsWith('insecure-test-hash:')).toBe(
      true,
    );
    expect(userRepository.users).toHaveLength(1);
  });

  it('rejects an email that is already registered', async () => {
    const { useCase, userRepository, passwordHasher } =
      createUseCase();

    await useCase.execute(validRegistration);

    await expect(
      useCase.execute({
        ...validRegistration,
        email: '  marta@EXAMPLE.com ',
      }),
    ).rejects.toThrow('EMAIL_ALREADY_REGISTERED');

    expect(userRepository.users).toHaveLength(1);
    expect(passwordHasher.hashCount).toBe(1);
  });

  it('rejects a password that does not respect the policy', async () => {
    const { useCase, userRepository } = createUseCase();

    await expect(
      useCase.execute({
        ...validRegistration,
        password: 'corta-2026',
      }),
    ).rejects.toThrow('PASSWORD_LENGTH_INVALID');

    expect(userRepository.users).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const { useCase, userRepository } = createUseCase();

    await expect(
      useCase.execute({
        ...validRegistration,
        email: 'marta@',
      }),
    ).rejects.toThrow('EMAIL_INVALID');

    expect(userRepository.users).toHaveLength(0);
  });
});
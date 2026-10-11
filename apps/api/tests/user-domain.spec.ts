import { describe, expect, it } from 'vitest';

import { Email } from '../src/modules/identity/domain/email.js';
import { User } from '../src/modules/identity/domain/user.js';

const createEmail = (): Email => Email.create('marta@example.com');

const createUser = (): User =>
  User.create({
    id: 'user-1',
    email: createEmail(),
    passwordHash: 'insecure-test-hash:abc',
    name: '  Marta Ferrer  ',
  });

describe('User', () => {
  it('creates an active customer', () => {
    const user = createUser();

    expect(user.currentStatus).toBe('ACTIVE');
    expect(user.currentRole).toBe('CUSTOMER');
    expect(user.isActive()).toBe(true);
  });

  it('trims the name', () => {
    expect(createUser().name).toBe('Marta Ferrer');
  });

  it('rejects a user without id', () => {
    expect(() =>
      User.create({
        id: '   ',
        email: createEmail(),
        passwordHash: 'insecure-test-hash:abc',
        name: 'Marta Ferrer',
      }),
    ).toThrow('USER_ID_REQUIRED');
  });

  it('rejects a user without name', () => {
    expect(() =>
      User.create({
        id: 'user-1',
        email: createEmail(),
        passwordHash: 'insecure-test-hash:abc',
        name: '   ',
      }),
    ).toThrow('USER_NAME_REQUIRED');
  });

  it('rejects a user without password hash', () => {
    expect(() =>
      User.create({
        id: 'user-1',
        email: createEmail(),
        passwordHash: '  ',
        name: 'Marta Ferrer',
      }),
    ).toThrow('USER_PASSWORD_HASH_REQUIRED');
  });

  it('rehydrates a locked operator', () => {
    const user = User.rehydrate({
      id: 'user-2',
      email: Email.create('OPERADOR@Example.com'),
      passwordHash: 'insecure-test-hash:abc',
      name: 'Operador',
      status: 'LOCKED',
      role: 'OPERATOR',
      createdAt: new Date('2026-10-11T10:00:00.000Z'),
    });

    expect(user.email.value).toBe('operador@example.com');
    expect(user.currentStatus).toBe('LOCKED');
    expect(user.currentRole).toBe('OPERATOR');
    expect(user.isActive()).toBe(false);
    expect(user.createdAt.toISOString()).toBe(
      '2026-10-11T10:00:00.000Z',
    );
  });
});
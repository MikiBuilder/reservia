import { describe, expect, it } from 'vitest';

import { Email } from '../src/modules/identity/domain/email.js';
import { PasswordPolicy } from '../src/modules/identity/domain/password-policy.js';

const policy = new PasswordPolicy();
const email = Email.create('marta@example.com');

describe('PasswordPolicy', () => {
  it('accepts a password that respects the policy', () => {
    expect(() =>
      policy.assertSecure({
        password: 'Sala-Mediterranea-2026',
        email,
      }),
    ).not.toThrow();
  });

  it('rejects a password that is too short', () => {
    expect(() =>
      policy.assertSecure({
        password: 'corta-2026',
        email,
      }),
    ).toThrow('PASSWORD_LENGTH_INVALID');
  });

  it('rejects a password that is too long', () => {
    expect(() =>
      policy.assertSecure({
        password: 'a'.repeat(129),
        email,
      }),
    ).toThrow('PASSWORD_LENGTH_INVALID');
  });

  it('rejects a password equal to the email', () => {
    const longEmail = Email.create(
      'una-direccion-muy-larga@example.com',
    );

    expect(() =>
      policy.assertSecure({
        password: 'Una-Direccion-Muy-Larga@Example.com',
        email: longEmail,
      }),
    ).toThrow('PASSWORD_TOO_PREDICTABLE');
  });
});
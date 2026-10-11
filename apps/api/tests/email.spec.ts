import { describe, expect, it } from 'vitest';

import { Email } from '../src/modules/identity/domain/email.js';

describe('Email', () => {
  it('normalizes whitespace and uppercase letters', () => {
    const email = Email.create('  Marta.Ferrer@Example.COM  ');

    expect(email.value).toBe('marta.ferrer@example.com');
  });

  it('considers equal emails with different casing', () => {
    const first = Email.create('marta@example.com');
    const second = Email.create('MARTA@example.com');

    expect(first.equals(second)).toBe(true);
  });

  it('rejects an email without domain', () => {
    expect(() => Email.create('marta@')).toThrow('EMAIL_INVALID');
  });

  it('rejects an email with spaces inside', () => {
    expect(() => Email.create('marta ferre@example.com')).toThrow(
      'EMAIL_INVALID',
    );
  });

  it('rejects an empty email', () => {
    expect(() => Email.create('   ')).toThrow('EMAIL_INVALID');
  });
});
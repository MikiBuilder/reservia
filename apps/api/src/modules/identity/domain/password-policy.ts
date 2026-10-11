import { Injectable } from '@nestjs/common';

import { Email } from './email.js';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

@Injectable()
export class PasswordPolicy {
  assertSecure(params: {
    password: string;
    email: Email;
  }): void {
    const { password, email } = params;

    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      throw new Error('PASSWORD_LENGTH_INVALID');
    }

    if (password.toLowerCase() === email.value) {
      throw new Error('PASSWORD_TOO_PREDICTABLE');
    }
  }
}
import { Email } from '../domain/email.js';

import {
  AccessTokenIssuer,
  IssuedAccessToken,
} from './access-token-issuer.js';
import { PasswordHasher } from './password-hasher.js';
import { UserRepository } from './user-repository.js';

export interface AuthenticateUserCommand {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  status: string;
  role: string;
  createdAt: Date;
}

export interface AuthenticationResult extends IssuedAccessToken {
  user: AuthenticatedUser;
}

const DUMMY_PLAIN_PASSWORD =
  'reservia-dummy-password-used-only-for-timing-equalization';

export class AuthenticateUser {
  private dummyPasswordHash: string | null = null;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenIssuer: AccessTokenIssuer,
  ) {}

  async execute(
    command: AuthenticateUserCommand,
  ): Promise<AuthenticationResult> {
    if (
      typeof command.email !== 'string' ||
      command.email.trim() === ''
    ) {
      throw new Error('INVALID_LOGIN_REQUEST');
    }

    if (
      typeof command.password !== 'string' ||
      command.password === ''
    ) {
      throw new Error('INVALID_LOGIN_REQUEST');
    }

    const email = this.parseEmail(command.email);

    const user = await this.userRepository.findByEmail(email);

    const passwordMatches = await this.verifyPassword(
      command.password,
      user?.passwordHash ?? null,
    );

    if (user === null || !passwordMatches) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (!user.isActive()) {
      throw new Error('USER_NOT_ACTIVE');
    }

    const issued = await this.accessTokenIssuer.issue({
      subject: user.id,
      email: user.email.value,
      role: user.currentRole,
    });

    return {
      ...issued,
      user: {
        id: user.id,
        email: user.email.value,
        name: user.name,
        status: user.currentStatus,
        role: user.currentRole,
        createdAt: user.createdAt,
      },
    };
  }

  private parseEmail(raw: string): Email {
    try {
      return Email.create(raw);
    } catch {
      throw new Error('INVALID_CREDENTIALS');
    }
  }

  private async verifyPassword(
    plainPassword: string,
    passwordHash: string | null,
  ): Promise<boolean> {
    if (passwordHash === null) {
      await this.passwordHasher.verify(
        plainPassword,
        await this.getDummyPasswordHash(),
      );
      return false;
    }

    return this.passwordHasher.verify(plainPassword, passwordHash);
  }

  private async getDummyPasswordHash(): Promise<string> {
    if (this.dummyPasswordHash === null) {
      this.dummyPasswordHash = await this.passwordHasher.hash(
        DUMMY_PLAIN_PASSWORD,
      );
    }

    return this.dummyPasswordHash;
  }
}
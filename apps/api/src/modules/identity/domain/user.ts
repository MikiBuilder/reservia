import { Email } from './email.js';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'OPERATOR';

export class User {
  private constructor(
    readonly id: string,
    readonly email: Email,
    readonly passwordHash: string,
    readonly name: string,
    private status: UserStatus,
    private role: UserRole,
    readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    email: Email;
    passwordHash: string;
    name: string;
    now?: Date;
  }): User {
    if (!params.id.trim()) {
      throw new Error('USER_ID_REQUIRED');
    }

    if (!params.passwordHash.trim()) {
      throw new Error('USER_PASSWORD_HASH_REQUIRED');
    }

    const name = params.name.trim();

    if (!name) {
      throw new Error('USER_NAME_REQUIRED');
    }

    return new User(
      params.id,
      params.email,
      params.passwordHash,
      name,
      'ACTIVE',
      'CUSTOMER',
      params.now ?? new Date(),
    );
  }

  static rehydrate(params: {
    id: string;
    email: Email;
    passwordHash: string;
    name: string;
    status: UserStatus;
    role: UserRole;
    createdAt: Date;
  }): User {
    if (!params.id.trim()) {
      throw new Error('USER_ID_REQUIRED');
    }

    if (!params.passwordHash.trim()) {
      throw new Error('USER_PASSWORD_HASH_REQUIRED');
    }

    if (!params.name.trim()) {
      throw new Error('USER_NAME_REQUIRED');
    }

    return new User(
      params.id,
      params.email,
      params.passwordHash,
      params.name,
      params.status,
      params.role,
      params.createdAt,
    );
  }

  get currentStatus(): UserStatus {
    return this.status;
  }

  get currentRole(): UserRole {
    return this.role;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }
}
import 'reflect-metadata';

import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import { Roles } from '../src/modules/identity/presentation/roles.decorator.js';
import { RolesGuard } from '../src/modules/identity/presentation/roles.guard.js';

class PublicHandler {
  handle(): void {}
}

class CustomerOnlyHandler {
  @Roles('CUSTOMER')
  handle(): void {}
}

class MultiRoleHandler {
  @Roles('CUSTOMER', 'OPERATOR')
  handle(): void {}
}

interface FakeUser {
  id: string;
  email: string;
  role: string;
}

function createContext(
  handler: object,
  controller: object,
  user?: FakeUser,
): ExecutionContext {
  return {
    getClass: () => controller,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows the request when no roles are required', () => {
    const context = createContext(
      PublicHandler.prototype.handle,
      PublicHandler,
      {
        id: 'user-1',
        email: 'marta@example.com',
        role: 'CUSTOMER',
      },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a user whose role is required', () => {
    const context = createContext(
      CustomerOnlyHandler.prototype.handle,
      CustomerOnlyHandler,
      {
        id: 'user-2',
        email: 'marta@example.com',
        role: 'CUSTOMER',
      },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a user with any of the required roles', () => {
    const context = createContext(
      MultiRoleHandler.prototype.handle,
      MultiRoleHandler,
      {
        id: 'user-3',
        email: 'operador@example.com',
        role: 'OPERATOR',
      },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a user with a different role', () => {
    const context = createContext(
      CustomerOnlyHandler.prototype.handle,
      CustomerOnlyHandler,
      {
        id: 'user-4',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    );

    expect(() => guard.canActivate(context)).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(context)).toThrow(
      'Insufficient role',
    );
  });

  it('rejects the request when there is no user', () => {
    const context = createContext(
      CustomerOnlyHandler.prototype.handle,
      CustomerOnlyHandler,
    );

    expect(() => guard.canActivate(context)).toThrow(
      ForbiddenException,
    );
  });
});
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AccessTokenVerifier } from '../application/access-token-verifier.js';

import { IS_PUBLIC_KEY } from './public.decorator.js';

interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: unknown;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject('AccessTokenVerifier')
    private readonly accessTokenVerifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const token = this.extractBearerToken(request);

    if (token === null) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      request.user = await this.accessTokenVerifier.verify(token);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'ACCESS_TOKEN_EXPIRED'
      ) {
        throw new UnauthorizedException('Access token has expired');
      }

      throw new UnauthorizedException('Access token is not valid');
    }

    return true;
  }

  private extractBearerToken(
    request: AuthenticatedRequest,
  ): string | null {
    const header = request.headers.authorization;

    if (typeof header !== 'string') {
      return null;
    }

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || token === undefined || token === '') {
      return null;
    }

    return token;
  }
}
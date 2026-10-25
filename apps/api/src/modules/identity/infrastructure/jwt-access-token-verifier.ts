import { JwtService } from '@nestjs/jwt';

import {
  AccessTokenVerifier,
  AuthenticatedPrincipal,
} from '../application/access-token-verifier.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export class JwtAccessTokenVerifier implements AccessTokenVerifier {
  constructor(private readonly jwtService: JwtService) {}

  async verify(token: string): Promise<AuthenticatedPrincipal> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'TokenExpiredError'
      ) {
        throw new Error('ACCESS_TOKEN_EXPIRED');
      }

      throw new Error('ACCESS_TOKEN_INVALID');
    }

    if (!payload.sub || !payload.email || !payload.role) {
      throw new Error('ACCESS_TOKEN_INVALID');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
import { JwtService } from '@nestjs/jwt';

import {
  AccessTokenClaims,
  AccessTokenIssuer,
  IssuedAccessToken,
} from '../application/access-token-issuer.js';

export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(
    private readonly jwtService: JwtService,
    private readonly accessTokenTtlSeconds: number,
  ) {}

  async issue(claims: AccessTokenClaims): Promise<IssuedAccessToken> {
    const accessToken = await this.jwtService.signAsync({
      sub: claims.subject,
      email: claims.email,
      role: claims.role,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
    };
  }
}
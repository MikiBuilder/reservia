import {
  AccessTokenClaims,
  AccessTokenIssuer,
  IssuedAccessToken,
} from '../src/modules/identity/application/access-token-issuer.js';

export class InMemoryAccessTokenIssuer implements AccessTokenIssuer {
  readonly issuedClaims: AccessTokenClaims[] = [];

  async issue(claims: AccessTokenClaims): Promise<IssuedAccessToken> {
    this.issuedClaims.push(claims);

    return {
      accessToken: `token-for-${claims.subject}`,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
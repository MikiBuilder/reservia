import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';

import { JwtAccessTokenIssuer } from '../src/modules/identity/infrastructure/jwt-access-token-issuer.js';

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const SECRET = 'secreto-de-tests-con-mas-de-32-caracteres';
const TTL_SECONDS = 900;

function createIssuer(): {
  issuer: JwtAccessTokenIssuer;
  jwtService: JwtService;
} {
  const jwtService = new JwtService({
    secret: SECRET,
    signOptions: { expiresIn: TTL_SECONDS },
  });

  return {
    issuer: new JwtAccessTokenIssuer(jwtService, TTL_SECONDS),
    jwtService,
  };
}

describe('JwtAccessTokenIssuer', () => {
  it('issues a signed bearer token with the configured ttl', async () => {
    const { issuer, jwtService } = createIssuer();

    const issued = await issuer.issue({
      subject: 'user-1',
      email: 'marta@example.com',
      role: 'CUSTOMER',
    });

    expect(issued.tokenType).toBe('Bearer');
    expect(issued.expiresIn).toBe(TTL_SECONDS);

    const payload = await jwtService.verifyAsync<DecodedToken>(
      issued.accessToken,
      { secret: SECRET },
    );
    expect(payload.sub).toBe('user-1');

    const decoded = jwtService.decode<DecodedToken>(issued.accessToken);
    const expiresIn = (decoded?.exp ?? 0) - (decoded?.iat ?? 0);
    expect(expiresIn).toBe(TTL_SECONDS);
  });

  it('includes only the minimal claims', async () => {
    const { issuer, jwtService } = createIssuer();

    const issued = await issuer.issue({
      subject: 'user-1',
      email: 'marta@example.com',
      role: 'CUSTOMER',
    });

    const decoded = jwtService.decode<DecodedToken>(issued.accessToken);

    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe('marta@example.com');
    expect(decoded?.role).toBe('CUSTOMER');
    expect(Object.keys(decoded ?? {}).sort()).toEqual([
      'email',
      'exp',
      'iat',
      'role',
      'sub',
    ]);
  });
});
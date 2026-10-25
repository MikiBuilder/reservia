import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';

import { JwtAccessTokenVerifier } from '../src/modules/identity/infrastructure/jwt-access-token-verifier.js';

const SECRET = 'secreto-de-tests-con-mas-de-32-caracteres';

function createVerifier(): {
  verifier: JwtAccessTokenVerifier;
  jwtService: JwtService;
} {
  const jwtService = new JwtService({ secret: SECRET });

  return {
    verifier: new JwtAccessTokenVerifier(jwtService),
    jwtService,
  };
}

describe('JwtAccessTokenVerifier', () => {
  it('returns the principal of a valid token', async () => {
    const { verifier, jwtService } = createVerifier();

    const token = await jwtService.signAsync({
      sub: 'user-1',
      email: 'marta@example.com',
      role: 'CUSTOMER',
    });

    await expect(verifier.verify(token)).resolves.toEqual({
      id: 'user-1',
      email: 'marta@example.com',
      role: 'CUSTOMER',
    });
  });

  it('rejects an expired token', async () => {
    const { verifier, jwtService } = createVerifier();

    const token = jwtService.sign({
      sub: 'user-1',
      email: 'marta@example.com',
      role: 'CUSTOMER',
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    await expect(verifier.verify(token)).rejects.toThrow(
      'ACCESS_TOKEN_EXPIRED',
    );
  });

  it('rejects a token with a broken signature', async () => {
    const { verifier, jwtService } = createVerifier();

    const token = await jwtService.signAsync({
      sub: 'user-1',
      email: 'marta@example.com',
      role: 'CUSTOMER',
    });
    const last = token.slice(-1);
    const tampered = `${token.slice(0, -1)}${last === 'a' ? 'b' : 'a'}`;

    await expect(verifier.verify(tampered)).rejects.toThrow(
      'ACCESS_TOKEN_INVALID',
    );
  });

  it('rejects a token signed with another secret', async () => {
    const { verifier } = createVerifier();
    const other = new JwtService({
      secret: 'otro-secreto-distinto-con-32-caracteres-min',
    });

    const token = await other.signAsync({
      sub: 'user-1',
      email: 'marta@example.com',
      role: 'CUSTOMER',
    });

    await expect(verifier.verify(token)).rejects.toThrow(
      'ACCESS_TOKEN_INVALID',
    );
  });

  it('rejects a token without the minimal claims', async () => {
    const { verifier, jwtService } = createVerifier();

    const token = await jwtService.signAsync({ foo: 'bar' });

    await expect(verifier.verify(token)).rejects.toThrow(
      'ACCESS_TOKEN_INVALID',
    );
  });

  it('rejects a string that is not a token', async () => {
    const { verifier } = createVerifier();

    await expect(
      verifier.verify('esto-no-es-un-jwt'),
    ).rejects.toThrow('ACCESS_TOKEN_INVALID');
  });
});
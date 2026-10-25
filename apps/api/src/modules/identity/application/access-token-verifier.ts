export interface AuthenticatedPrincipal {
  id: string;
  email: string;
  role: string;
}

export interface AccessTokenVerifier {
  verify(token: string): Promise<AuthenticatedPrincipal>;
}
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface TokenResponse {
  accessToken: string;
}

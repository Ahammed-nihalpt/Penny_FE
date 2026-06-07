export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface TokenResponse {
  accessToken: string;
}

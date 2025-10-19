export interface DecodedToken {
  sub: string;
  email: string;
  nameid: string;
  role: string;
  exp: number;
  iss?: string;
  aud?: string
}
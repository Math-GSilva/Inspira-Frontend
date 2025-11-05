export interface DecodedToken {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
  iss?: string;
  aud?: string;
  urlPerfil: string;
}
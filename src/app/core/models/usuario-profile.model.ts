export interface UsuarioProfile {
  id: string;
  username: string;
  nomeCompleto: string;
  bio?: string; 
  urlFotoPerfil: string;
  contagemSeguidores: number;
  contagemSeguindo: number;
  seguidoPeloUsuarioAtual: boolean;

  urlPortifolio?: string | null;
  urlLinkedin?: string | null;
  urlInstagram?: string | null;
}
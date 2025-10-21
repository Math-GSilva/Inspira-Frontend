export interface UsuarioSearchResultDto {
  id: string;
  nomeCompleto: string;
  nomeUsuario: string;
  fotoPerfilUrl?: string; 
  seguidoPeloUsuarioAtual: boolean;
}
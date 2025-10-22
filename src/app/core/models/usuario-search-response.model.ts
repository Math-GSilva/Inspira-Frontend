export interface UsuarioSearchResultDto {
  id: string;
  nomeCompleto: string;
  username: string;
  urlFotoPerfil?: string; 
  seguidoPeloUsuarioAtual: boolean;
}
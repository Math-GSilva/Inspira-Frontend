export interface ObraDeArte {
  id: string;
  titulo: string;
  descricao: string;
  dataPublicacao: string;
  autorUsername: string;
  urlFotoPerfilAutor: string;
  categoriaNome: string;
  url?: string;
  totalCurtidas: number;
  curtidaPeloUsuario?: boolean;
  showCommentBox?: boolean;
  tipoConteudoMidia?: string;
}
export interface UpdateObraDeArteDto {
  titulo: string;
  descricao: string;
  categoriaId: string;
}
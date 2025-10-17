export interface ObraDeArte {
  id: string;
  titulo: string;
  descricao: string;
  dataPublicacao: string;
  autorUsername: string;
  categoriaNome: string;
  url?: string;
  totalCurtidas: number;
  curtidoPeloUsuario?: boolean;
  showCommentBox?: boolean;
}
export interface UpdateObraDeArteDto {
  titulo: string;
  descricao: string;
  categoriaId: string;
}
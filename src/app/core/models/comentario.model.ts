export interface Comentario {
  id: string;
  conteudo: string;
  dataComentario: Date;
  autorUsername: string;
  obraDeArteId: string;
  urlFotoPerfil: string;
}

export interface CreateComentarioDto {
  obraDeArteId: string;
  conteudo: string;
}
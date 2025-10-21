export interface Comentario {
  id: string;
  conteudo: string;
  dataComentario: Date; // Vem como string ISO
  autorUsername: string;
  obraDeArteId: string;
  urlFotoPerfil: string;
}

// O que precisamos de enviar para criar um novo comentário
export interface CreateComentarioDto {
  obraDeArteId: string;
  conteudo: string;
}
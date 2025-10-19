export interface Comentario {
  id: string;
  conteudo: string;
  dataCriacao: string; // Vem como string ISO
  autorUsername: string;
  obraDeArteId: string;
}

// O que precisamos de enviar para criar um novo comentário
export interface CreateComentarioDto {
  obraDeArteId: string;
  conteudo: string;
}
export interface Categoria {
  id: string;
  nome: string;
  descricao: string;
}

export interface CreateCategoriaDto {
  nome: string;
  descricao: string;
}

export interface UpdateCategoriaDto {
  nome: string;
}
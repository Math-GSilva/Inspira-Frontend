export interface CreateCurtidaDto {
  obraDeArteId: string;
}

// O que a API devolve após uma ação de curtir/descurtir
// Assumindo que o DTO de resposta contém o novo total de curtidas e se o utilizador atual curtiu
export interface CurtidaResponseDto {
  totalCurtidas: number;
  curtidoPeloUsuario: boolean;
}
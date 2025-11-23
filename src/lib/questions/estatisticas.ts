import { api } from "../axios";


export interface AlternativaStat {
  id: number;
  letra: string;
  texto: string;
  is_correta: boolean;
  total_votos: number;
  porcentagem: string; // "45.5%"
}

export interface QuestaoStats {
  total_respostas: number;
  taxa_acerto: number; // 67.6
  distribuicao: {
    acertos: number;
    erros: number;
  };
  alternativas_stats: AlternativaStat[];
}

/**
 * Busca as estatísticas de uma questão específica.
 */
export const getQuestaoStats = async (token: string, questaoId: number): Promise<QuestaoStats> => {
  try {
    const response = await api.get<QuestaoStats>(`/admin/questoes/${questaoId}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar stats:", error);
    throw new Error("Falha ao carregar estatísticas.");
  }
};
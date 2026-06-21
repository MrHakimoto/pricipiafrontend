import { api } from "../axios";

export type QuestaoAlternativeStats = {
  id: number;
  letra: string;
  total: number;
  total_votos?: number;
  porcentagem: number;
  is_correta: boolean;
};

export type QuestaoStats = {
  questao_id: number;
  total_respostas: number;
  total_acertos: number;
  taxa_acerto: number;
  accuracy_rate?: number;
  distribuicao: {
    acertos: number;
    erros: number;
  };
  alternativas: QuestaoAlternativeStats[];
  alternativas_stats?: QuestaoAlternativeStats[];
};

export async function getQuestaoStats(
  token: string,
  questaoId: number,
): Promise<QuestaoStats> {
  const response = await api.get(`/questoes/${questaoId}/estatisticas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
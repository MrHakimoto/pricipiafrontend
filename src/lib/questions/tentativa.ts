// lib/questions/tentativa.ts

import { api } from "../axios";
import type { RespostaQuestao } from "@/types/questions";

// ------------------------------
// TIPAGENS
// ------------------------------

export interface ListaResolucao {
  id: number;
  user_id: number;
  lista_id: number;
  status: string;
  score_final?: number | null | undefined;
  total_questoes?: number | null;
  [key: string]: any;
}

export interface SalvarRespostaResponse {
  message: string;

  resposta: {
    foi_correta?: boolean | null;
    correta?: boolean | null;
    [key: string]: any;
  };

  resolucao_status?: "iniciado" | "finalizado" | "terminado" | string | null;
  resolucao?: ListaResolucao | null;
  estatisticas?: any;
  is_correct?: boolean | null;
  foi_correta?: boolean | null;
}

export interface FinalizarTentativaResponse {
  message: string;
  resolucao: ListaResolucao;
}

export interface ResultadoTentativa {
  id: number;
  lista: any;
  respostas: any[];
  [key: string]: any;
}

// ------------------------------
// HELPERS
// ------------------------------

function validarRespostaQuestao(resposta: RespostaQuestao): void {
  if (!resposta.questao_id) {
    throw new Error("ID da Questão é obrigatório.");
  }

  switch (resposta.tipo) {
    case "objetiva": {
      if (!resposta.alternativa_id) {
        throw new Error("ID da Alternativa é obrigatório para questão objetiva.");
      }

      return;
    }

    case "discursiva": {
      if (!resposta.resposta_texto?.trim()) {
        throw new Error("A resposta textual é obrigatória para questão discursiva.");
      }

      if (typeof resposta.correta !== "boolean") {
        throw new Error(
          "A autoavaliação é obrigatória para questão discursiva."
        );
      }

      return;
    }

    case "resposta_numerica": {
      if (!resposta.resposta_numerica?.trim()) {
        throw new Error(
          "A resposta numérica é obrigatória para questão de resposta numérica."
        );
      }

      return;
    }

    case "certo_errado": {
      if (
        resposta.resposta_certo_errado !== "certo" &&
        resposta.resposta_certo_errado !== "errado"
      ) {
        throw new Error(
          "A resposta certo/errado deve ser 'certo' ou 'errado'."
        );
      }

      return;
    }

    default: {
      const _exhaustiveCheck: never = resposta;
      throw new Error(`Tipo de resposta inválido: ${_exhaustiveCheck}`);
    }
  }
}

function montarPayloadResposta(resposta: RespostaQuestao) {
  switch (resposta.tipo) {
    case "objetiva":
      return {
        tipo: "objetiva",
        questao_id: resposta.questao_id,
        alternativa_id: resposta.alternativa_id,
      };

    case "discursiva":
      return {
        tipo: "discursiva",
        questao_id: resposta.questao_id,
        resposta_texto: resposta.resposta_texto,
        correta: resposta.correta,
      };

    case "resposta_numerica":
      return {
        tipo: "resposta_numerica",
        questao_id: resposta.questao_id,
        resposta_numerica: resposta.resposta_numerica,
      };

    case "certo_errado":
      return {
        tipo: "certo_errado",
        questao_id: resposta.questao_id,
        resposta_certo_errado: resposta.resposta_certo_errado,
      };

    default: {
      const _exhaustiveCheck: never = resposta;
      throw new Error(`Tipo de resposta inválido: ${_exhaustiveCheck}`);
    }
  }
}

// ------------------------------
// 1. INICIAR TENTATIVA
// ------------------------------

/**
 * Cria a tentativa da lista.
 *
 * Rota:
 * POST /api/listas/{listaId}/iniciar-tentativa
 */
export const iniciarTentativa = async (
  listaId: number | string,
  token: string
): Promise<ListaResolucao> => {
  if (!listaId) throw new Error("ID da Lista é obrigatório.");
  if (!token) throw new Error("Token é obrigatório.");

  try {
    const response = await api.post(
      `/listas/${listaId}/iniciar-tentativa`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Erro ao iniciar tentativa:",
      error.response?.data || error.message
    );
    throw new Error("Falha ao iniciar a tentativa.");
  }
};

// ------------------------------
// 2. SALVAR RESPOSTA UNIVERSAL
// ------------------------------

/**
 * Salva qualquer tipo de resposta:
 *
 * objetiva:
 * {
 *   tipo: "objetiva",
 *   questao_id: 1,
 *   alternativa_id: 10
 * }
 *
 * discursiva:
 * {
 *   tipo: "discursiva",
 *   questao_id: 2,
 *   resposta_texto: "Minha resposta...",
 *   correta: true
 * }
 *
 * resposta_numerica:
 * {
 *   tipo: "resposta_numerica",
 *   questao_id: 3,
 *   resposta_numerica: "42"
 * }
 *
 * certo_errado:
 * {
 *   tipo: "certo_errado",
 *   questao_id: 4,
 *   resposta_certo_errado: "certo"
 * }
 *
 * Rota:
 * POST /api/resolucoes/{resolucaoId}/responder
 */
export const salvarResposta = async (
  resolucaoId: number | string,
  resposta: RespostaQuestao,
  token: string
): Promise<SalvarRespostaResponse> => {
  if (!resolucaoId) {
    throw new Error("ID da Resolução (tentativa) é obrigatório.");
  }

  if (!token) {
    throw new Error("Token é obrigatório.");
  }

  validarRespostaQuestao(resposta);

  try {
    const payload = montarPayloadResposta(resposta);

    const response = await api.post(
      `/resolucoes/${resolucaoId}/responder`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Erro ao salvar resposta:",
      error.response?.data || error.message
    );
    throw new Error("Falha ao salvar a resposta.");
  }
};

// ------------------------------
// 2.1 COMPATIBILIDADE COM O MODELO ANTIGO
// ------------------------------

/**
 * Compatibilidade temporária com o sistema atual.
 *
 * Use esta função onde ainda estiver assim:
 * salvarRespostaAntiga(resolucaoId, questaoId, alternativaId, token)
 *
 * Depois, aos poucos, trocamos tudo para salvarResposta(...).
 */
export const salvarRespostaObjetiva = async (
  resolucaoId: number | string,
  questaoId: number | string,
  alternativaId: number | string,
  token: string
): Promise<SalvarRespostaResponse> => {
  return salvarResposta(
    resolucaoId,
    {
      tipo: "objetiva",
      questao_id: Number(questaoId),
      alternativa_id: Number(alternativaId),
    },
    token
  );
};

// ------------------------------
// 3. FINALIZAR TENTATIVA
// ------------------------------

/**
 * Finaliza a tentativa.
 *
 * Rota:
 * POST /api/resolucoes/{resolucaoId}/finalizar
 */
export const finalizarTentativa = async (
  resolucaoId: number | string,
  token: string
): Promise<FinalizarTentativaResponse> => {
  if (!resolucaoId) throw new Error("ID da Resolução (tentativa) é obrigatório.");
  if (!token) throw new Error("Token é obrigatório.");

  try {
    const response = await api.post(
      `/resolucoes/${resolucaoId}/finalizar`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Erro ao finalizar tentativa:",
      error.response?.data || error.message
    );
    throw new Error("Falha ao finalizar a tentativa.");
  }
};

// ------------------------------
// 4. BUSCAR RESULTADOS
// ------------------------------

/**
 * Busca o resultado de uma tentativa.
 *
 * Rota:
 * GET /api/resolucoes/{resolucaoId}
 */
export const getResultadoTentativa = async (
  resolucaoId: number | string,
  token: string
): Promise<ResultadoTentativa> => {
  if (!resolucaoId) throw new Error("ID da Resolução (tentativa) é obrigatório.");
  if (!token) throw new Error("Token é obrigatório.");

  try {
    const response = await api.get(`/resolucoes/${resolucaoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "Erro ao buscar resultado da tentativa:",
      error.response?.data || error.message
    );
    throw new Error("Falha ao buscar o resultado.");
  }
};

// ------------------------------
// 5. BUSCAR TENTATIVA ATIVA
// ------------------------------

/**
 * Busca tentativa ativa de uma lista.
 *
 * Rota:
 * GET /api/listas/{listaId}/tentativa-ativa
 */
export const getTentativaAtiva = async (
  listaId: number | string,
  token: string
): Promise<ListaResolucao | null> => {
  if (!listaId) throw new Error("ID da Lista é obrigatório.");
  if (!token) throw new Error("Token é obrigatório.");

  try {
    const response = await api.get(`/listas/${listaId}/tentativa-ativa`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }

    console.error(
      "Erro ao buscar tentativa ativa:",
      error.response?.data || error.message
    );
    throw new Error("Falha ao buscar a tentativa ativa.");
  }
};

// ------------------------------
// 6. RESPONDER QUESTÃO AVULSA
// ------------------------------

/**
 * Responde uma questão avulsa.
 *
 * Por enquanto, mantive compatível com objetiva.
 * Depois podemos transformar para RespostaQuestao também.
 */
export const responderQuestaoAvulsa = async (
  token: string,
  questaoId: number | string,
  alternativaId: number | string
) => {
  if (!token) throw new Error("Token é obrigatório.");
  if (!questaoId) throw new Error("ID da Questão é obrigatório.");
  if (!alternativaId) throw new Error("ID da Alternativa é obrigatório.");

  const response = await api.post(
    `/questoes/${questaoId}/responder-avulsa`,
    { alternativa_id: alternativaId },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
};
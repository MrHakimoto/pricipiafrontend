import { api } from "../axios"; // A sua instância do Axios

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
    foi_correta: boolean | null;
    [key: string]: any;
  };
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
// 1. INICIAR TENTATIVA
// ------------------------------

/**
 * 1. INICIAR TENTATIVA (Obrigatório)
 * Antes de responder qualquer questão, você DEVE chamar esta rota.
 * Ela cria a "tentativa" (a linha na tabela-mãe 'lista_resolucoes').
 * Rota: POST /api/listas/{listaId}/iniciar-tentativa
 *
 * @param {number|string} listaId - O ID da lista que o aluno vai começar.
 * @param {string} token - JWT do usuário para autenticação
 *
 * @sends (Envia)
 * - Payload (Corpo JSON): {} (Vazio)
 *
 * @receives (Recebe)
 * - Promise<ListaResolucao>
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

    // Você DEVE guardar este 'response.data.id' no seu estado do frontend
    return response.data;
  } catch (error: any) {
    console.error("Erro ao iniciar tentativa:", error.response?.data || error.message);
    throw new Error("Falha ao iniciar a tentativa.");
  }
};

// ------------------------------
// 2. SALVAR RESPOSTA
// ------------------------------

/**
 * 2. SALVAR RESPOSTA (Para Listas Padrão E Simulados)
 * Esta é a rota que o aluno chama CADA VEZ que marca uma alternativa.
 * Rota: POST /api/resolucoes/{resolucaoId}/responder
 *
 * @param {number|string} resolucaoId - O ID da "tentativa".
 * @param {number|string} questaoId - O ID da questão respondida.
 * @param {number|string} alternativaId - O ID da alternativa marcada.
 * @param {string} token - JWT de autenticação
 *
 * @sends
 * - { "questao_id": number, "alternativa_id": number }
 *
 * @receives
 * - Promise<SalvarRespostaResponse>
 */
export const salvarResposta = async (
  resolucaoId: number | string,
  questaoId: number | string,
  alternativaId: number | string,
  token: string
): Promise<SalvarRespostaResponse> => {
  if (!resolucaoId) throw new Error("ID da Resolução (tentativa) é obrigatório.");
  if (!questaoId) throw new Error("ID da Questão é obrigatório.");
  if (!alternativaId) throw new Error("ID da Alternativa é obrigatório.");
  if (!token) throw new Error("Token é obrigatório.");

  try {
    const payload = {
      questao_id: questaoId,
      alternativa_id: alternativaId,
    };

    const response = await api.post(
      `/resolucoes/${resolucaoId}/responder`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Erro ao salvar resposta:", error.response?.data || error.message);
    throw new Error("Falha ao salvar a resposta.");
  }
};

// ------------------------------
// 3. FINALIZAR TENTATIVA
// ------------------------------

/**
 * 3. FINALIZAR TENTATIVA (O "Veredito" do Simulado)
 * O aluno clica em "Finalizar Simulado". O backend calcula a nota.
 * Rota: POST /api/resolucoes/{resolucaoId}/finalizar
 *
 * @param {number|string} resolucaoId - O ID da "tentativa".
 * @param {string} token - JWT
 *
 * @receives
 * - Promise<FinalizarTentativaResponse>
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
    console.error("Erro ao finalizar tentativa:", error.response?.data || error.message);
    throw new Error("Falha ao finalizar a tentativa.");
  }
};

// ------------------------------
// 4. BUSCAR RESULTADOS
// ------------------------------

/**
 * 4. BUSCAR RESULTADOS (Para mostrar o Gabarito/Correção)
 * Usado para carregar a página de resultados de uma tentativa já finalizada.
 * Rota: GET /api/resolucoes/{resolucaoId}
 *
 * @param {number|string} resolucaoId - ID da tentativa finalizada.
 * @param {string} token - JWT
 *
 * @receives
 * - Promise<ResultadoTentativa>
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
    console.error("Erro ao buscar resultado da tentativa:", error.response?.data || error.message);
    throw new Error("Falha ao buscar o resultado.");
  }
};


/**
 * [NOVA FUNÇÃO] Busca tentativa ativa para uma lista
 * Rota: GET /api/listas/{listaId}/tentativa-ativa
 */
export const getTentativaAtiva = async (listaId: number | string,
  token: string) => {
  if (!listaId) throw new Error("ID da Lista é obrigatório.");
  
  try {
    const response = await api.get(`/listas/${listaId}/tentativa-ativa`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Retorna a tentativa ou null
  } catch (error: any) {
    // Se for 404 ou não encontrar, retorna null em vez de erro
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Erro ao buscar tentativa ativa:", error.response?.data || error.message);
    throw new Error("Falha ao buscar a tentativa ativa.");
  }
};
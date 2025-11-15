import { api } from "../axios";

/**
 * O "Heartbeat" (Ping). Envia o segundo atual do vídeo para o backend.
 * Rota: POST /api/aulas/{courseContentId}/progresso
 *
 * @param {number|string} courseContentId - O ID da aula (course_content) que está a ser assistida.
 * @param {number} timestamp - O segundo atual do vídeo (ex: 125).
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Payload (Corpo JSON): { "timestamp": 125 }
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<{ message: string }> // Ex: "Progresso salvo."
 */
export const sendHeartbeat = async (courseContentId: number, timestamp: number, token: string) => {
  if (!courseContentId) throw new Error("ID do conteúdo da aula é obrigatório.");
  if (!token) throw new Error("Token não fornecido.");

  try {
    const payload = { timestamp: Math.floor(timestamp) }; // Garante que é um inteiro
    
    // Para POST, o config (com headers) é o TERCEIRO argumento
    const response = await api.post(`/aulas/${courseContentId}/progresso`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Erro ao enviar heartbeat:", error.response?.data || error.message);
    // Este erro pode ser ignorado silenciosamente na maioria dos casos
  }
};

/**
 * Tenta marcar uma aula como "Concluída".
 * O backend fará a validação final dos 60%.
 * Rota: POST /api/aulas/{courseContentId}/concluir
 *
 * @param {number|string} courseContentId - O ID da aula (course_content).
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Payload (Corpo JSON): {} (Vazio)
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe em caso de sucesso - 200 OK)
 * - Promise<{ message: string }> // "Aula marcada como concluída!"
 *
 * @receives (Recebe em caso de falha na validação - 403 Forbidden)
 * - Promise<{ message: string }> // "É necessário assistir pelo menos 60% da aula."
 */
export const markLessonCompleted = async (courseContentId: number, token: string) => {
  if (!courseContentId) throw new Error("ID do conteúdo da aula é obrigatório.");
  if (!token) throw new Error("Token não fornecido.");

  try {
    // O 2º argumento (payload) é um objeto vazio
    const response = await api.post(`/aulas/${courseContentId}/concluir`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Erro ao concluir aula:", error.response?.data || error.message);
    // Lança o erro para que a UI possa mostrar a mensagem (ex: "Assista 60%")
    throw error;
  }
};

/**
 * Marca uma aula como "Não Concluída".
 * Rota: POST /api/aulas/{courseContentId}/desconcluir
 *
 * @param {number|string} courseContentId - O ID da aula (course_content).
 * @param {string} token - O token de autenticação (Bearer token).
 */
export const markLessonUncompleted = async (courseContentId: number, token: string) => {
  if (!courseContentId) throw new Error("ID do conteúdo da aula é obrigatório.");
  if (!token) throw new Error("Token não fornecido.");

  try {
    // O 2º argumento (payload) é um objeto vazio
    const response = await api.post(`/aulas/${courseContentId}/desconcluir`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Erro ao desmarcar aula:", error.response?.data || error.message);
    // Lança o erro para que a UI possa mostrar a mensagem
    throw error;
  }
};
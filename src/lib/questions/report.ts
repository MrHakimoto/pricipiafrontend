import { api } from "../axios"; // Sua instância configurada do Axios
import type { AxiosError } from 'axios';

/**
 * Define a estrutura de dados que o backend espera para um novo reporte.
 */
interface ReportPayload {
  title?: string;
  message: string;
  type?: string;
}

/**
 * Envia um novo chamado de suporte (reporte) para os administradores.
 * Rota: POST /api/support-requests
 *
 * @param {ReportPayload} data - O objeto contendo a mensagem do reporte.
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Payload (Corpo JSON): { "title": "...", "message": "...", "type": "..." }
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<AdminNotification> - O objeto do chamado recém-criado.
 */
export const inviteReport = async (data: ReportPayload, token: string): Promise<any> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!data || !data.message) throw new Error("A mensagem é obrigatória para o reporte.");

  try {
    const response = await api.post("/support-requests", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error("Erro ao enviar reporte:", axiosError.response?.data || axiosError.message);
    throw new Error("Falha ao enviar o reporte.");
  }
};

/**
 * Busca os detalhes de uma lista e todas as suas questões (sem paginação).
 * Rota: GET /api/listas/{id}/questoes
 *
 * @param {number} id - O ID da lista a ser buscada.
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<{
 * lista_info: Lista, // Objeto com os dados da lista e "colunas virtuais"
 * questoes: Array<Questao> // Array com as questões completas
 * }>
 */
export const getListaById = async (id: number, token: string): Promise<any> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!id) throw new Error("ID da lista não fornecido.");

  try {
    const response = await api.get(`/listas/${id}/questoes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(`Erro ao buscar questões da lista #${id}:`, axiosError.response?.data || axiosError.message);
    throw new Error("Falha ao buscar as questões da lista.");
  }
};
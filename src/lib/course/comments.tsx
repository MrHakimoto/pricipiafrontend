//lib/course/comments.tsx
import { api } from "../axios"; // A sua instância do Axios
import type { AxiosError } from "axios";

// =================================================================
// INTERFACES (TIPAGENS) PARA OS COMENTÁRIOS
// =================================================================

/**
 * Define a estrutura do objeto de Utilizador (Autor)
 * que vem aninhado dentro do comentário.
 */
interface CommentAuthor {
  id: number;
  name: string;
  avatar: string | null;
  // Adicione outros campos do 'user' se necessário (ex: 'is_admin')
}

/**
 * Define a estrutura principal de um Comentário.
 * Note que 'replies' (respostas) é um array de 'ContentComment',
 * permitindo o aninhamento (respostas de respostas).
 */
export interface ContentComment {
  id: number;
  user_id: number;
  course_content_id: number;
  parent_id: number | null; // O ID do comentário "pai" (se for uma resposta)
  body: string;
  is_visible: boolean;
  is_pinned: boolean;
  created_at: string; // Ex: "2025-11-15T12:30:00.000000Z"
  author: CommentAuthor; // O objeto do autor
  replies: ContentComment[]; // As respostas aninhadas
}

/**
 * Define a estrutura de paginação padrão do Laravel.
 */
interface LaravelPaginationObject<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// =================================================================
// FUNÇÕES DA API DE COMENTÁRIOS (PARA ALUNOS)
// =================================================================

/**
 * 1. BUSCAR COMENTÁRIOS
 * Busca a lista paginada de comentários de NÍVEL SUPERIOR (parent_id = null)
 * para uma aula específica. As respostas ('replies') já vêm aninhadas.
 * Rota: GET /api/aulas/{courseContentId}/comments
 *
 * @param {string} token - O token de autenticação (Bearer token).
 * @param {number|string} courseContentId - O ID do conteúdo (aula/vídeo).
 * @param {number} [page] - Opcional. O número da página de comentários.
 *
 * @sends (Envia)
 * - Query Params: /api/aulas/42/comments?page=1
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<LaravelPaginationObject<ContentComment>> - Um objeto de paginação
 * onde 'data' é um array de comentários "pais" (com 'replies' dentro).
 */
export const getLessonComments = async (
  token: string,
  courseContentId: number | string,
  page: number = 1
): Promise<LaravelPaginationObject<ContentComment>> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!courseContentId) throw new Error("ID do Conteúdo é obrigatório.");

  try {
    const response = await api.get<LaravelPaginationObject<ContentComment>>(
      `/aulas/${courseContentId}/comments`,
      {
        params: { page },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar comentários:", err.response?.data || err.message);
    throw new Error("Falha ao buscar os comentários.");
  }
};

/**
 * 2. POSTAR UM NOVO COMENTÁRIO (ou RESPOSTA)
 * Rota: POST /api/aulas/{courseContentId}/comments
 *
 * @param {string} token - O token de autenticação (Bearer token).
 * @param {number|string} courseContentId - O ID do conteúdo (aula/vídeo).
 * @param {string} body - O texto do comentário.
 * @param {number|null} [parentId] - Opcional. Se for uma resposta, envie o ID do comentário "pai".
 *
 * @sends (Envia)
 * - Payload (Corpo JSON):
 * { "body": "Ótima aula, professor!" }
 * OU (se for uma resposta)
 * { "body": "Obrigado pela dica!", "parent_id": 10 }
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<ContentComment> - O objeto do comentário recém-criado.
 */
export const postLessonComment = async (
  token: string,
  courseContentId: number | string,
  body: string,
  parentId: number | null = null
): Promise<ContentComment> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!courseContentId) throw new Error("ID do Conteúdo é obrigatório.");
  if (!body) throw new Error("O corpo do comentário não pode estar vazio.");

  const payload = {
    body,
    parent_id: parentId,
  };

  try {
    const response = await api.post<ContentComment>(
      `/aulas/${courseContentId}/comments`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao postar comentário:", err.response?.data || err.message);
    throw new Error("Falha ao postar o comentário.");
  }
};

/**
 * 3. ATUALIZAR UM COMENTÁRIO
 * Permite que o *autor* do comentário edite o seu próprio texto.
 * Rota: PUT /api/comments/{commentId}
 *
 * @param {string} token - O token de autenticação (Bearer token).
 * @param {number|string} commentId - O ID do comentário a ser editado.
 * @param {string} body - O novo texto do comentário.
 *
 * @sends (Envia)
 * - Payload (Corpo JSON): { "body": "Editado: Ótima aula!" }
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<ContentComment> - O objeto do comentário atualizado.
 */
export const updateLessonComment = async (
  token: string,
  commentId: number | string,
  body: string
): Promise<ContentComment> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!commentId) throw new Error("ID do Comentário é obrigatório.");
  if (!body) throw new Error("O corpo do comentário não pode estar vazio.");

  try {
    const response = await api.put<ContentComment>(
      `/comments/${commentId}`,
      { body },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao atualizar comentário:", err.response?.data || err.message);
    throw new Error("Falha ao atualizar o comentário.");
  }
};

/**
 * 4. APAGAR UM COMENTÁRIO
 * Permite que o *autor* do comentário (ou um Admin) o apague.
 * Rota: DELETE /api/comments/{commentId}
 *
 * @param {string} token - O token de autenticação (Bearer token).
 * @param {number|string} commentId - O ID do comentário a ser apagado.
 *
 * @sends (Envia)
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<void> (Status 204 No Content)
 */
export const deleteLessonComment = async (
  token: string,
  commentId: number | string
): Promise<void> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!commentId) throw new Error("ID do Comentário é obrigatório.");

  try {
    await api.delete(`/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao apagar comentário:", err.response?.data || err.message);
    throw new Error("Falha ao apagar o comentário.");
  }
};
//lib/forum/forum.tsx
import { api } from "../axios";
import type { AxiosError } from "axios";

// =================================================================
// INTERFACES (TIPAGENS) PARA O FÓRUM
// =================================================================

// Define a estrutura de um objeto de Utilizador (Autor)
export interface Author {
  id: number;
  name: string;
  avatar: string | null;
}

// Define a estrutura de uma Resposta do Fórum
export interface ForumReply {
  id: number;
  user_id: number;
  forum_thread_id: number;
  body: string;
  created_at: string;
  author: Author; // O autor da resposta
}

export type LinkableContent = {
  id: number;
  title: string;
  module_id?: number;
  content_type?: string;
  estimated_time_minutes?: number;
  content_url?: string;
  list_id?: number | null;
  order?: number;
  created_at?: string;
  updated_at?: string;
  duration_in_seconds?: number;
} | null;


export interface CourseContent {
  id: number;
  module_id: number;
  title: string;
  content_type: string;
  estimated_time_minutes: number;
  content_url: string;
  list_id: number | null;
  order: number;
  created_at: string;
  updated_at: string;
  duration_in_seconds: number;
}

// Define a estrutura de um Tópico (Dúvida)
export interface ForumThread {
  id: number;
  user_id: number;
  title: string;
  body: string;
  is_closed: boolean;
  best_reply_id: number | null;
  created_at: string;
  author: Author;
  replies_count?: number;
  replies?: ForumReply[];
  linkable_type: string | null;
  linkable_id: number | null;
  linkable: CourseContent | null; // Atualize para usar o tipo específico
}

// Define a estrutura do payload para criar um novo tópico
export interface CreateThreadData {
  title: string;
  body: string;
  linkable_type?: 'Questao' | 'CourseContent';
  linkable_id?: number;
}

// Define a estrutura genérica de paginação do Laravel
export interface LaravelPaginationObject<T> {
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
// FUNÇÕES DA API DO FÓRUM (PARA ALUNOS)
// =================================================================

/**
 * 1. LISTAR TÓPICOS
 * Busca a lista paginada de todos os tópicos (dúvidas) abertos no fórum.
 * Rota: GET /api/forum
 */
export const getForumThreads = async (
  token: string,
  page: number = 1
): Promise<LaravelPaginationObject<ForumThread>> => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.get<LaravelPaginationObject<ForumThread>>("/forum", {
      params: { page },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar tópicos do fórum:", err.response?.data || err.message);
    throw new Error("Falha ao buscar os tópicos do fórum.");
  }
};

/**
 * 2. VER UM TÓPICO
 * Busca um tópico específico pelo ID e todas as suas respostas.
 * Rota: GET /api/forum/{threadId}
 */
export const getForumThreadDetails = async (
  token: string,
  threadId: number | string
): Promise<ForumThread> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!threadId) throw new Error("ID do Tópico é obrigatório.");

  try {
    const response = await api.get<ForumThread>(`/forum/${threadId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Erro ao buscar tópico #${threadId}:`, err.response?.data || err.message);
    throw new Error("Falha ao buscar os detalhes do tópico.");
  }
};

/**
 * 3. CRIAR UM TÓPICO (FAZER UMA PERGUNTA)
 * Cria uma nova dúvida no fórum.
 * Rota: POST /api/forum
 */
export const createForumThread = async (
  token: string,
  data: CreateThreadData
): Promise<ForumThread> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!data.title || !data.body) throw new Error("Título e Corpo são obrigatórios.");

  try {
    const response = await api.post<ForumThread>("/forum", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao criar tópico:", err.response?.data || err.message);
    throw new Error("Falha ao criar o tópico.");
  }
};

/**
 * 4. RESPONDER UM TÓPICO
 * Adiciona uma nova resposta a um tópico existente.
 * Rota: POST /api/forum/{threadId}/replies
 */
export const postForumReply = async (
  token: string,
  threadId: number | string,
  body: string
): Promise<ForumReply> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!threadId) throw new Error("ID do Tópico é obrigatório.");
  if (!body) throw new Error("O corpo da resposta não pode estar vazio.");

  try {
    const response = await api.post<ForumReply>(`/forum/${threadId}/replies`, { body }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao postar resposta:", err.response?.data || err.message);
    throw new Error("Falha ao postar a resposta.");
  }
};

/**
 * 5. MARCAR MELHOR RESPOSTA (SANAR DÚVIDA)
 * O *autor do tópico* clica para marcar uma resposta como a "Melhor".
 * Rota: POST /api/forum/{threadId}/mark-best-reply/{replyId}
 */
export const markBestReply = async (
  token: string,
  threadId: number | string,
  replyId: number | string
): Promise<ForumThread> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!threadId || !replyId) throw new Error("ID do Tópico e da Resposta são obrigatórios.");

  try {
    const response = await api.post<ForumThread>(`/forum/${threadId}/mark-best-reply/${replyId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao marcar melhor resposta:", err.response?.data || err.message);
    throw new Error("Falha ao marcar a melhor resposta.");
  }
};

/**
 * 6. REABRIR TÓPICO
 * O *autor do tópico* decide reabrir o tópico.
 * Rota: POST /api/forum/{threadId}/reopen
 */
export const reopenThread = async (
  token: string,
  threadId: number | string
): Promise<ForumThread> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!threadId) throw new Error("ID do Tópico é obrigatório.");

  try {
    const response = await api.post<ForumThread>(`/forum/${threadId}/reopen`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao reabrir tópico:", err.response?.data || err.message);
    throw new Error("Falha ao reabrir o tópico.");
  }
};
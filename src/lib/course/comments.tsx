// lib/course/comments.ts
import { api } from "../axios";
import type { AxiosError } from "axios";

// =================================================================
// INTERFACES
// =================================================================

export interface CommentAuthorRole {
  id: number;
  name: string;
  slug: string;
  display_name: string | null;
  description: string | null;
  priority: number | null;
  is_staff: boolean | number | null;
  is_active: boolean | number | null;
}

export interface CommentAuthorGamification {
  user_id: number;
  current_points: number;
  current_level: number;
  current_streak: number;
}

export interface CommentAuthor {
  id: number;
  name: string;
  avatar: string | null;
  roles?: CommentAuthorRole[];
  gamification?: CommentAuthorGamification | null;
}

export interface ContentComment {
  id: number;
  user_id: number;
  course_content_id: number;
  parent_id: number | null;
  body: string;
  is_visible: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;

  author: CommentAuthor | null;

  replies: ContentComment[];

  likes_count?: number;
  liked_by_me?: boolean;
}

export interface LaravelPaginationObject<T> {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

// =================================================================
// FUNÇÕES DA API DE COMENTÁRIOS
// =================================================================

export const getLessonComments = async (
  token: string,
  courseContentId: number | string,
  page: number = 1,
): Promise<LaravelPaginationObject<ContentComment>> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!courseContentId) throw new Error("ID do Conteúdo é obrigatório.");

  try {
    const response = await api.get<LaravelPaginationObject<ContentComment>>(
      `/aulas/${courseContentId}/comments`,
      {
        params: { page },
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError;

    console.error(
      "Erro ao buscar comentários:",
      err.response?.data || err.message,
    );

    throw new Error("Falha ao buscar os comentários.");
  }
};

export const postLessonComment = async (
  token: string,
  courseContentId: number | string,
  body: string,
  parentId: number | null = null,
): Promise<ContentComment> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!courseContentId) throw new Error("ID do Conteúdo é obrigatório.");
  if (!body?.trim()) throw new Error("O corpo do comentário não pode estar vazio.");

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
      },
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError;

    console.error(
      "Erro ao postar comentário:",
      err.response?.data || err.message,
    );

    throw new Error("Falha ao postar o comentário.");
  }
};

export const updateLessonComment = async (
  token: string,
  commentId: number | string,
  body: string,
): Promise<ContentComment> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!commentId) throw new Error("ID do Comentário é obrigatório.");
  if (!body?.trim()) throw new Error("O corpo do comentário não pode estar vazio.");

  try {
    const response = await api.put<ContentComment>(
      `/comments/${commentId}`,
      { body },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError;

    console.error(
      "Erro ao atualizar comentário:",
      err.response?.data || err.message,
    );

    throw new Error("Falha ao atualizar o comentário.");
  }
};

export const deleteLessonComment = async (
  token: string,
  commentId: number | string,
): Promise<void> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!commentId) throw new Error("ID do Comentário é obrigatório.");

  try {
    await api.delete(`/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    const err = error as AxiosError;

    console.error(
      "Erro ao apagar comentário:",
      err.response?.data || err.message,
    );

    throw new Error("Falha ao apagar o comentário.");
  }
};
// lib/course/like.tsx
import { api } from "../axios";
import type { AxiosError } from "axios";

export interface ToggleLikeResponse {
  message: string;
  liked: boolean;
  likes_count: number;
}

export interface ToggleLikeRequest {
  entity_type: "aula" | "duvida" | "comentario";
  entity_id: number;
}

/**
 * Alterna o like em uma entidade (aula, dúvida ou comentário)
 */
export const toggleLike = async (
  session: string,
  data: ToggleLikeRequest
): Promise<ToggleLikeResponse> => {
  try {
    const response = await api.post<ToggleLikeResponse>("/likes/toggle", data, {
      headers: {
        Authorization: `Bearer ${session}`,
      },
    });
    
    console.log("toggleLike - Sucesso:", response.data);
    return response.data;

  } catch (error: any) {
    console.error("toggleLike - Erro:", error);

    const message =
      error.response?.data?.message ||
      error.message ||
      "Erro ao alternar curtida";

    throw new Error(message);
  }
};

/**
 * Obtém o estado de like de uma entidade
 * (Nota: Você precisará criar este endpoint no backend se ainda não existir)
 */
export const getLikeStatus = async (
  session: string,
  entity_type: "aula" | "duvida" | "comentario",
  entity_id: number
): Promise<{ liked: boolean; likes_count: number }> => {
  try {
    const response = await api.get(`/likes/status`, {
      params: { entity_type, entity_id },
      headers: {
        Authorization: `Bearer ${session}`,
      },
    });
    
    return response.data;

  } catch (error: any) {
    console.error("getLikeStatus - Erro:", error);
    
    // Se o endpoint não existir, retorna estado padrão
    return { liked: false, likes_count: 0 };
  }
};
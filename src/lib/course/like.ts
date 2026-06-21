import { api } from "../axios";

export interface ToggleLikeResponse {
  message: string;
  liked: boolean;
  likes_count: number;
}

export interface ToggleLikeRequest {
  entity_type: "aula" | "duvida" | "comentario" | "resposta_forum";
  entity_id: number;
}

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

    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Erro ao alternar curtida";

    throw new Error(message);
  }
};

export const getLikeStatus = async (
  session: string,
  entity_type: "aula" | "duvida" | "comentario" | "resposta_forum",
  entity_id: number
): Promise<{ liked: boolean; likes_count: number }> => {
  try {
    const response = await api.get("/likes/status", {
      params: { entity_type, entity_id },
      headers: {
        Authorization: `Bearer ${session}`,
      },
    });

    return response.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("getLikeStatus - Erro:", error);
    }

    return { liked: false, likes_count: 0 };
  }
};
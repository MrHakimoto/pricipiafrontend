import { api } from "../axios";

export type FavoriteEntityType = "aula" | "duvida" | "questao" | "lista";

export interface ToggleFavoriteRequest {
  entity_type: FavoriteEntityType;
  entity_id: number;
}

export interface ToggleFavoriteResponse {
  message: string;
  favorited: boolean;
}

export async function toggleFavorite(
  token: string,
  data: ToggleFavoriteRequest,
): Promise<ToggleFavoriteResponse> {
  try {
    const response = await api.post<ToggleFavoriteResponse>(
      "/favorites/toggle",
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Erro ao alternar favorito";

    throw new Error(message);
  }
}

export async function getFavoriteStatus(
  token: string,
  entity_type: FavoriteEntityType,
  entity_id: number,
): Promise<{ favorited: boolean }> {
  try {
    const response = await api.get("/favorites/status", {
      params: {
        entity_type,
        entity_id,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("getFavoriteStatus - Erro:", error);
    }

    return {
      favorited: false,
    };
  }
}
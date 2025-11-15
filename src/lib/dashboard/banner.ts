import { api } from "../axios";
import type { AxiosError } from "axios";

export const fetchActiveBanners = async (token: string) => {
  try {
    const response = await api.get("/banners", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;

  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar banners:", err.response?.data || err.message);
    return [];
  }
};

/**
 * Busca a última aula que o utilizador interagiu para o card "Continuar Assistindo".
 * Rota: GET /api/dashboard/continuar-assistindo
 *
 * @sends (Envia)
 * - (Nada no corpo, token enviado automaticamente)
 *
 * @receives (Recebe)
 * - Promise<{
 * aula: object, // O objeto completo do CourseContent (com module, font, course)
 * last_watched_timestamp: number // O segundo onde o utilizador parou
 * } | null> // Retorna null se o utilizador nunca assistiu nada
 */
export const getContinueWatching = async (token: string) => {
  try {
    const response = await api.get("/dashboard/continuar-assistindo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar continuar assistindo:", err.response?.data || err.message);
    return [];
  }
};

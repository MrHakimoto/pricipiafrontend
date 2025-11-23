//lib/dailyCheck/daily.ts
import { api } from "../axios"; // Sua instância configurada do Axios
import type { AxiosError } from "axios";

/**
 * Busca o estado atual do streak e o status do check-in do utilizador logado.
 * Rota: GET /api/checkin-status
 *
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Requisição GET.
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe em caso de sucesso)
 * - Promise<UserStreak>
 * (Exemplo:
 * {
 * "id": 1,
 * "user_id": 1,
 * "current_streak": 5,
 * "longest_streak": 10,
 * "last_checkin_date": "2025-11-08",
 * "has_checked_in_today": false // Campo virtual adicionado pelo controller
 * })
 */
export const checkinStatus = async (token: string) => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.get("/checkin-status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar status do check-in:", error);
    throw new Error("Falha ao buscar o status do check-in.");
  }
};

export const getUser = async (token: string) => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.get("/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar status do check-in:", error);
    throw new Error("Falha ao buscar o status do check-in.");
  }
};

/**
 * Tenta realizar o check-in diário para o utilizador logado.
 * Rota: POST /api/checkin
 *
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Requisição POST.
 * - Corpo (Body): {} (Um objeto vazio, pois o controller usa o user do token)
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe em caso de sucesso - 201 Created)
 * - Promise<{
 * message: string, // "Check-in realizado com sucesso!"
 * streak: UserStreak // O objeto do streak atualizado
 * }>
 *
 * @receives (Recebe em caso de conflito - 409 Conflict)
 * - Promise<{
 * message: string, // "Check-in já realizado hoje."
 * streak: UserStreak // O objeto do streak atual
 * }>
 */
export const checkinDaily = async (token: string) => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.post("/checkin", {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;

  } catch (error) {
    const err = error as AxiosError;

    if (err.response && err.response.status === 409) {
      console.warn("Check-in diário: Já realizado hoje.");
      return err.response.data; // ✅ agora o TS entende
    }

    console.error("Erro ao realizar o check-in:", err);
    throw new Error("Falha ao realizar o check-in.");
  }
};
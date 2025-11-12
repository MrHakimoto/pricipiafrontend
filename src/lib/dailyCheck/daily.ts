//lib/dailyCheck/daily.ts
import { api } from "../axios"; // Sua instância configurada do Axios

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
    // [CORRIGIDO] Ação de check-in usa 'api.post'.
    // O 2º argumento é o corpo (body), o 3º é a configuração (headers).
    const response = await api.post("/checkin", {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    // Se o erro for 409 (Conflict), significa que já fez check-in.
    // Isso não é um "erro" real, então podemos retornar os dados.
    if (error.response && error.response.status === 409) {
      console.warn("Check-in diário: Já realizado hoje.");
      return error.response.data; // Retorna a resposta (ex: { message: "..." })
    }

    console.error("Erro ao realizar o check-in:", error);
    throw new Error("Falha ao realizar o check-in.");
  }
};
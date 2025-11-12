//lib/perfil/norifications.tsx
import { api } from "../axios"; // Sua instância configurada do Axios

/**
 * Busca a lista de todas as notificações ativas e visíveis para o utilizador logado.
 * Rota: GET /api/notifications
 *
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<Array<{
 * id: number,
 * title: string,
 * message: string | null,
 * link_url: string | null,
 * icon: string | null,
 * type: 'info' | 'warning' | 'success' | 'error',
 * created_at: string,
 * is_read: boolean
 * }>>
 */
export const fetchNotifications = async (token: string) => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.get("/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    throw new Error("Falha ao buscar notificações.");
  }
};

/**
 * Busca a contagem de notificações não lidas (para o "sininho").
 * Rota: GET /api/notifications/unread-count
 *
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<{ unread_count: number }>
 * (Exemplo: { "unread_count": 5 })
 */
export const fetchUnreadNotificationCount = async (token: string) => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.get("/notifications/unread-count", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar contagem de notificações:", error);
    throw new Error("Falha ao buscar contagem.");
  }
};

/**
 * Marca uma notificação específica como LIDA.
 * Rota: POST /api/notifications/read
 *
 * @param {number | string} notificationId - O ID da notificação a ser marcada.
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Payload (Corpo JSON): { "notification_id": notificationId }
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<{ message: string }>
 * (Exemplo: { "message": "Notificação marcada como lida." })
 */
export const markNotificationAsRead = async (notificationId: number | string, token: string) => {
  if (!notificationId) throw new Error("ID da notificação é obrigatório.");
  if (!token) throw new Error("Token não fornecido.");
  
  const payload = { notification_id: notificationId };

  try {
    // Para POST/PUT, o config (com headers) é o TERCEIRO argumento
    const response = await api.post("/notifications/read", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    throw new Error("Falha ao marcar como lida.");
  }
};

/**
 * Marca uma notificação específica como ESCONDIDA (descartada).
 * Rota: POST /api/notifications/hide
 *
 * @param {number | string} notificationId - O ID da notificação a ser escondida.
 * @param {string} token - O token de autenticação (Bearer token).
 *
 * @sends (Envia)
 * - Payload (Corpo JSON): { "notification_id": notificationId }
 * - Headers: { Authorization: "Bearer <token>" }
 *
 * @receives (Recebe)
 * - Promise<{ message: string }>
 * (Exemplo: { "message": "Notificação escondida." })
 */
export const hideNotification = async (notificationId: number | string, token: string) => {
  if (!notificationId) throw new Error("ID da notificação é obrigatório.");
  if (!token) throw new Error("Token não fornecido.");

  const payload = { notification_id: notificationId };

  try {
    const response = await api.post("/notifications/hide", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao esconder notificação:", error);
    throw new Error("Falha ao esconder notificação.");
  }
};


/**
 * Marca TODAS as notificações não lidas como LIDAS.
 * Rota: POST /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (token: string) => {
  if (!token) throw new Error("Token não fornecido.");
  
  try {
    const response = await api.post("/notifications/read-all", {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    throw new Error("Falha ao marcar todas como lidas.");
  }
};
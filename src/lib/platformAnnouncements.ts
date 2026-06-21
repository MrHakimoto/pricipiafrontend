// lib/platformAnnouncements.ts
import { api } from "@/lib/axios";

export type PlatformAnnouncementVariant =
  | "vibrant"
  | "warning"
  | "success"
  | "info"
  | "maintenance";

export type PlatformAnnouncement = {
  id: number;
  title: string;
  description?: string | null;
  eyebrow?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  variant?: PlatformAnnouncementVariant | string | null;
  is_active: boolean;
  is_dismissible: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  priority?: number;
  created_at?: string;
  updated_at?: string;
};

function normalizeToken(token: string | undefined | null): string {
  if (!token) return "";

  return String(token)
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function authHeaders(token: string) {
  const cleanToken = normalizeToken(token);

  if (!cleanToken) return {};

  return {
    Authorization: `Bearer ${cleanToken}`,
  };
}

/**
 * Busca o comunicado ativo para aparecer acima da navbar.
 *
 * GET /platform-announcements/active
 */
export async function getActivePlatformAnnouncement(
  token: string | undefined | null,
): Promise<PlatformAnnouncement | null> {
  const cleanToken = normalizeToken(token);

  if (!cleanToken) {
    return null;
  }

  try {
    const response = await api.get("/platform-announcements/active", {
      headers: authHeaders(cleanToken),
    });

    return response.data?.data ?? null;
  } catch (error) {
    console.error("Erro ao buscar comunicado ativo:", error);
    return null;
  }
}
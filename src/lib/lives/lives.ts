// lib/lives/lives.ts
import { api } from "../axios";

export type Live = {
  id: number | string;
  title: string;
  thumb: string | null;
  status: "scheduled" | "ready" | "live" | "ended" | string;
  starts_at: string | null;
  description?: string | null;
};

export const getLives = async (session: string): Promise<Live[]> => {
  try {
    const response = await api.get("/lives", {
      headers: { Authorization: `Bearer ${session}` },
    });

    // pode vir {data: [...]}
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;

    return [];
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Erro ao buscar lives";
    throw new Error(message);
  }
};
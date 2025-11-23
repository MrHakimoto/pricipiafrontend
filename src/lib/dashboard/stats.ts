// lib/dashboard/stats.ts
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

export const fetchStudentStats = async (token: string) => {
  try {
    const [listasResponse, acertosResponse] = await Promise.all([
      api.get("/getStudantStatsListas", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      api.get("/getStatsAcertos", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    return {
      listas: listasResponse.data,
      acertos: acertosResponse.data,
    };
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar stats:", err.response?.data || err.message);
    return null;
  }
};
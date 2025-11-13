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

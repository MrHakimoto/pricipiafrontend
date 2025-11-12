import { api } from "../axios";

export const getListOficial = async (token: string): Promise<any> => {
  if (!token) return { data: [] };

  try {
    const response = await api.get("/listas/oficiais", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar questões:", error);
    return { data: [] };
  }
};

export const getListaById = async (id: number, token: string): Promise<any> => {
  if (!token) return { data: [] };

  try {
    const response = await api.get(`/listas/${id}/questoes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar questões:", error);
    return { data: [] };
  }
};

import { api } from "../axios";

export const getModuloContents = async (moduloId, session) => {
  try {
    const response = await api.get(`/modules/${moduloId}/contents`, {
      headers: {
        Authorization: `Bearer ${session}`,
      },
    });
    
    console.log("getModuloContents - DEU Sucesso:", response.data);
    return response.data;
    
  } catch (error) {
    console.error("getModuloContents - DEU Erro:", error);
    throw error;
  }
};

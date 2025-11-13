import { api } from "../axios";

export const getModuloContents = async (moduloId: string, session: string) => {
  try {
    const response = await api.get(`/modules/${moduloId}/contents`, {
      headers: {
        Authorization: `Bearer ${session}`,
      },
    });
    
    console.log("getModuloContents - DEU Sucesso:", response.data);
    return response.data;

  } catch (error: any) {
    console.error("getModuloContents - DEU Erro:", error);

    // tenta extrair uma mensagem legível
    const message =
      error.response?.data?.message ||
      error.message ||
      "Erro ao buscar conteúdos do módulo";

    // lança um Error com mensagem padronizada
    throw new Error(message);
  }
};

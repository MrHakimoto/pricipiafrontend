// auth.api.ts
import { AxiosError } from "axios";
import { api } from "../axios";

// Envia email de recuperação
export const forgotPassword = async (email: string) => {
  try {
    const response = await api.post("/forgot-password", { email });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;

    // Se o backend mandou mensagem de erro
    if (err.response?.data) {
      throw err.response.data; 
    }

    // Erro genérico
    throw { message: "Erro inesperado ao enviar o e-mail." };
  }
};

// Envia email de link mágico
export const requestMagicLink = async (email: string) => {
  return api.post("/magic-link/request", { email });
};

// Verifica e loga com link mágico
export const verifyMagicLink = async (userId: string, queryParams: string) => {
  // queryParams deve ser "?expires=...&signature=..."
  return api.post(`/magic-link/verify/${userId}${queryParams}`);
};


export const unlinkGoogleAccount = async (token: string) => {
  try {
    const response = await api.post("/user/unlink-google", {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    console.error("Erro ao desvincular Google:", error.response?.data || error.message);
    // Repassa o erro para o componente mostrar (ex: "Defina uma senha antes")
    throw error; 
  }
};
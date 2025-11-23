// lib/respostaAvulsa.ts
import { api } from '@/lib/axios';
import type { AxiosError } from 'axios';

export const responderQuestaoAvulsa = async (
  questaoId: number,
  alternativaId: number,
  token: string
): Promise<{ message: string; is_correct: boolean; gabarito: number }> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!questaoId) throw new Error("ID da questão não fornecido.");
  if (!alternativaId) throw new Error("ID da alternativa não fornecido.");

  try {
    const response = await api.post(
      `/questoes/${questaoId}/responder-avulsa`,
      {
        alternativa_id: alternativaId,
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error("Erro ao responder questão avulsa:", axiosError.response?.data || axiosError.message);
    throw new Error("Falha ao enviar a resposta.");
  }
};
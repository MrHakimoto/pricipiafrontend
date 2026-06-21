// lib/respostaAvulsa.ts

import { api } from "@/lib/axios";
import type { AxiosError } from "axios";

type ResponderQuestaoAvulsaResponse = {
  message: string;
  is_correct: boolean;
  gabarito: number;
};

type BackendResponderAvulsaResponse = {
  message?: string;
  is_correct?: boolean;
  foi_correta?: boolean;
  gabarito?:
    | number
    | {
        alternativa_correta_id?: number;
        resposta_numerica?: string | null;
        gabarito_certo_errado?: string | null;
        resposta_esperada?: string | null;
        criterio_correcao?: string | null;
      };
  alternativa_correta_id?: number;
  correct_alternative_id?: number;
};

const authHeaders = (token: string) => ({
  Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const responderQuestaoAvulsa = async (
  questaoId: number,
  alternativaId: number,
  token: string,
): Promise<ResponderQuestaoAvulsaResponse> => {
  const cleanToken = token?.trim();

  if (!cleanToken) throw new Error("Token não fornecido.");

  if (!Number.isFinite(questaoId) || questaoId <= 0) {
    throw new Error("ID da questão inválido.");
  }

  if (!Number.isFinite(alternativaId) || alternativaId <= 0) {
    throw new Error("ID da alternativa inválido.");
  }

  try {
    const response = await api.post<BackendResponderAvulsaResponse>(
      `/questoes/${questaoId}/responder-avulsa`,
      {
        tipo: "objetiva",
        alternativa_id: alternativaId,
      },
      {
        headers: authHeaders(cleanToken),
      },
    );

    const data = response.data;

    const gabarito =
      typeof data.gabarito === "object"
        ? data.gabarito?.alternativa_correta_id
        : data.gabarito ??
          data.alternativa_correta_id ??
          data.correct_alternative_id;

    if (!gabarito) {
      throw new Error("A API não retornou o gabarito da questão.");
    }

    return {
      message: data.message ?? "Resposta registrada.",
      is_correct: Boolean(data.is_correct ?? data.foi_correta),
      gabarito: Number(gabarito),
    };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;

    console.error(
      "Erro ao responder questão avulsa:",
      axiosError.response?.data || axiosError.message,
    );

    throw new Error(
      axiosError.response?.data?.message || "Falha ao enviar a resposta.",
    );
  }
};
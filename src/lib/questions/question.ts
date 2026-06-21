// lib/questions/question.ts

import { api } from "../axios";

export type QuestionAlternative = {
  id: number;
  texto: string;
  letra: string;
  ordem?: number | null;
};

export type QuestionTopic = {
  id: number;
  nome: string;
  assunto?: {
    id: number;
    nome: string;
    frente?: {
      id: number;
      nome: string;
    } | null;
  } | null;
};

export type QuestionExam = {
  id: number;
  nome: string;
  sigla?: string | null;
  ano?: number | null;
  banca?: {
    id: number;
    nome: string;
    sigla?: string | null;
  } | null;
};

export type SingleQuestion = {
  id: number;
  tipo?:
    | "objetiva"
    | "discursiva"
    | "resposta_numerica"
    | "certo_errado"
    | string;

  enunciado: string;

  alternativas?: QuestionAlternative[];
  alternativa_correta_id?: number | null;

  resposta_esperada?: string | null;
  criterio_correcao?: string | null;
  resposta_numerica?: string | null;
  gabarito_certo_errado?: "certo" | "errado" | null;

  gabarito_comentado_texto?: string | null;
  gabarito_video?: string | null;
  minutagem?: string | null;

  adaptado?: boolean | null;
  dificuldade?: number | null;
  tempo_resolucao?: number | null;

  prova?: QuestionExam | null;
  topicos?: QuestionTopic[];
};

export async function getQuestionById(
  id: number | string,
  token?: string,
): Promise<SingleQuestion> {
  if (!id) {
    throw new Error("ID da questão não informado.");
  }

  try {
    const response = await api.get(`/questoes/${id}`, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    });

    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar questão #${id}:`, error);
    throw new Error("Não foi possível carregar a questão.");
  }
}
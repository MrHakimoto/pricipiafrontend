// lib/questions/provasFamosas.ts
import { AxiosError } from "axios";
import { api } from "../axios";

/**
 * Representa o agrupamento de provas (ex: ENEM, FUVEST)
 */
export interface ProvaGroup {
  id: number;
  nome: string;
  total_edicoes: number;

  // necessário para seu componente
  edicoes?: ProvaEdition[];
}

/**
 * Representa uma edição específica de uma prova
 */
export interface ProvaEdition {
  id: number;
  ano: number;
  descricao?: string;

  // necessárias para seu componente
  tempo_total: number;
  total_questoes: number;
}

/**
 * Cria uma lista de simulado a partir de uma prova oficial
 */
export const gerarSimuladoDaProva = async (
  token: string,
  editionId: string,
  selectedTime: string
) => {
  if (!token) throw new Error("Token obrigatório");

  try {
    const response = await api.post<{ lista_id: number; message: string }>(
      `/provas/${editionId}/gerar-simulado`,
      { selectedTime },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    console.error("Erro ao gerar simulado:", error);
    throw new Error("Não foi possível gerar o simulado.");
  }
};

/**
 * Buscar todas as provas disponíveis
 */
export const getAvailableExams = async (
  token: string
): Promise<ProvaGroup[]> => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.get<ProvaGroup[]>("/provas/disponiveis", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error(
      "Erro ao buscar provas disponíveis:",
      err.response?.data || err.message
    );
    return [];
  }
};

/**
 * Buscar edições por nome da prova
 */
export const getEditionsByExam = async (
  token: string,
  nomeProva: string
): Promise<ProvaEdition[]> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!nomeProva) throw new Error("Nome da prova é obrigatório.");

  try {
    const response = await api.get<ProvaEdition[]>("/provas/edicoes", {
      params: { nome: nomeProva },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error(
      `Erro ao buscar edições para ${nomeProva}:`,
      err.response?.data || err.message
    );
    return [];
  }
};

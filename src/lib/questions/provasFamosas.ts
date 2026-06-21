// lib/questions/provasFamosas.ts

import { AxiosError } from "axios";
import { api } from "../axios";

export interface ProvaGroup {
  id: number;
  nome: string;
  sigla?: string | null;
  slug?: string | null;
  descricao?: string | null;
  tipo?: string | null;

  logo_url?: string | null;
  logo_dark_url?: string | null;
  logo_light_url?: string | null;
  pdf_logo_url?: string | null;
  cover_image_url?: string | null;
  cover_for_display?: string | null;

  is_featured?: boolean;
  is_active: boolean;

  total_edicoes: number;
  total_questoes?: number;

  edicoes?: ProvaEdition[];
}

export interface ProvaEdition {
  id: number;
  ano: number | null;
  nome?: string;
  sigla?: string | null;
  descricao?: string | null;
  foto_url?: string | null;

  tempo_total: number;
  total_questoes: number;

  banca?: {
    id: number;
    nome: string;
    sigla?: string | null;
  } | null;
}

const authHeaders = (token: string) => ({
  Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
});

export const gerarSimuladoDaProva = async (
  token: string,
  editionId: string | number,
  selectedTime: string | number
) => {
  if (!token) throw new Error("Token obrigatório.");
  if (!editionId) throw new Error("Edição obrigatória.");

  try {
    const response = await api.post<{ lista_id: number; message: string }>(
      `/provas/${editionId}/gerar-simulado`,
      {
        selectedTime: Number(selectedTime),
      },
      {
        headers: authHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<any>;

    console.error(
      "Erro ao gerar simulado:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message || "Não foi possível gerar o simulado."
    );
  }
};

export const getAvailableExams = async (
  token: string
): Promise<ProvaGroup[]> => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.get<ProvaGroup[]>("/provas/disponiveis", {
      headers: authHeaders(token),
    });

    /**
     * Blindagem do frontend.
     * O backend também deve filtrar por is_active = true.
     */
    return response.data.filter((umbrella) => umbrella.is_active === true);
  } catch (error) {
    const err = error as AxiosError;

    console.error(
      "Erro ao buscar umbrellas disponíveis:",
      err.response?.data || err.message
    );

    return [];
  }
};

export const getEditionsByExam = async (
  token: string,
  umbrellaId: string | number
): Promise<ProvaEdition[]> => {
  if (!token) throw new Error("Token não fornecido.");
  if (!umbrellaId) throw new Error("Umbrella obrigatória.");

  try {
    const response = await api.get<ProvaEdition[]>(
      `/prova-umbrellas/${umbrellaId}/edicoes`,
      {
        headers: authHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<any>;

    console.error(
      `Erro ao buscar edições da umbrella ${umbrellaId}:`,
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ||
        "Não foi possível buscar as edições desta prova."
    );
  }
};



export const baixarPdfDaLista = async (
  token: string,
  listaId: string | number,
  filename = "simulado.pdf"
) => {
  if (!token) throw new Error("Token não fornecido.");
  if (!listaId) throw new Error("Lista obrigatória.");

  try {
    const response = await api.get(`/listas/${listaId}/pdf`, {
      params: {
        pdfType: "simulado",
      },
      headers: authHeaders(token),
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    const err = error as AxiosError;

    console.error(
      "Erro ao baixar PDF:",
      err.response?.data || err.message
    );

    throw new Error("Não foi possível baixar o PDF.");
  }
};
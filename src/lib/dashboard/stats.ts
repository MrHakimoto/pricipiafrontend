// lib/dashboard/stats.ts
import { api } from "../axios";
import type { AxiosError } from "axios";

// Tipagens
export interface ListasFeitasResponse {
  total_listas_concluidas: number;
  total_simulados: number;
}

export interface AcertosErrosResponse {
  acertos: number;
  erros: number;
  total: number;
  taxa_acerto: string;
}

export interface StudentStats {
  listas: ListasFeitasResponse;
  acertos: AcertosErrosResponse;
}

export interface Banner {
  id: number;
  titulo: string;
  imagem_url: string;
  link?: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface ListaItem {
  id: number;
  name: string;
  progress: number;
  type: 'simulado' | 'exercicio' | 'prova' | 'revisao';
  disciplina?: string;
}

// Funções da API
export const fetchActiveBanners = async (token: string): Promise<Banner[]> => {
  try {
    const response = await api.get<Banner[]>("/banners", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar banners:", err.response?.data || err.message);
    return [];
  }
};

export const fetchListasFeitas = async (token: string): Promise<ListasFeitasResponse> => {
  try {
    const response = await api.get<ListasFeitasResponse>("/getStudantStatsListas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar listas:", err.response?.data || err.message);
    return {
      total_listas_concluidas: 0,
      total_simulados: 0
    };
  }
};

export const fetchAcertosErros = async (token: string): Promise<AcertosErrosResponse> => {
  try {
    const response = await api.get<AcertosErrosResponse>("/getStatsAcertos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar acertos/erros:", err.response?.data || err.message);
    return {
      acertos: 0,
      erros: 0,
      total: 0,
      taxa_acerto: "0%"
    };
  }
};

export const fetchStudentStats = async (token: string): Promise<StudentStats | null> => {
  try {
    const [listasResponse, acertosResponse] = await Promise.all([
      fetchListasFeitas(token),
      fetchAcertosErros(token),
    ]);

    return {
      listas: listasResponse,
      acertos: acertosResponse,
    };
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar stats:", err.response?.data || err.message);
    return null;
  }
};
// lib/dashboard/homeStats.ts
import { api } from "../axios";
import type { AxiosError } from "axios";

export interface ListaDetalhe {
  id: number;
  nome: string;
  acertos: number;
  erros: number;
  total: number;
  data_conclusao: string;
}

export interface ListasStats {
  simulados_provas: {
    concluidas: number;
    acertos: number;
    erros: number;
    detalhes: ListaDetalhe[];
  };
  listas_praticas: {
    concluidas: number;
    acertos: number;
    erros: number;
    detalhes: ListaDetalhe[];
  };
}

export interface AssuntoStats {
  assunto: string;
  acertos: number;
  erros: number;
  total: number;
}

export interface TopicoErrado {
  topico: string;
  erros: number;
}

export interface EvolucaoSemanal {
  periodo: string;
  total: number;
  acertos: number;
  erros: number;
}

export interface QuestoesStats {
  geral: {
    total: number;
    acertos: number;
    erros: number;
  };
  por_assunto: AssuntoStats[];
  topicos_mais_errados: TopicoErrado[];
  evolucao_semanal: EvolucaoSemanal[];
}

export interface HomeStats {
  listas_stats: ListasStats;
  questoes_stats: QuestoesStats;
}

export const getHomeStats = async (token: string): Promise<HomeStats> => {
  try {
    const response = await api.get("/getHomeStats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data as HomeStats;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Erro ao buscar home stats:", err.response?.data || err.message);
    throw new Error(err.message);
  }
}
// // Tipagens
// export interface ListasFeitasResponse {
//   total_listas_concluidas: number;
//   total_simulados: number;
// }

// export interface AcertosErrosResponse {
//   acertos: number;
//   erros: number;
//   total: number;
//   taxa_acerto: string;
// }

// export interface StudentStats {
//   listas: ListasFeitasResponse;
//   acertos: AcertosErrosResponse;
// }

// export interface Banner {
//   id: number;
//   titulo: string;
//   imagem_url: string;
//   link?: string;
//   ativo: boolean;
//   ordem: number;
//   created_at: string;
//   updated_at: string;
// }

// export interface ListaItem {
//   id: number;
//   name: string;
//   progress: number;
//   type: 'simulado' | 'exercicio' | 'prova' | 'revisao';
//   disciplina?: string;
// }

// Funções da API
// export const fetchActiveBanners = async (token: string): Promise<Banner[]> => {
//   try {
//     const response = await api.get<Banner[]>("/banners", {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data;
//   } catch (error) {
//     const err = error as AxiosError;
//     console.error("Erro ao buscar banners:", err.response?.data || err.message);
//     return [];
//   }
// };


// };

// export const fetchAcertosErros = async (token: string): Promise<AcertosErrosResponse> => {
//   try {
//     const response = await api.get<AcertosErrosResponse>("/getStatsAcertos", {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data;
//   } catch (error) {
//     const err = error as AxiosError;
//     console.error("Erro ao buscar acertos/erros:", err.response?.data || err.message);
//     return {
//       acertos: 0,
//       erros: 0,
//       total: 0,
//       taxa_acerto: "0%"
//     };
//   }
// };

// export const fetchStudentStats = async (token: string): Promise<StudentStats | null> => {
//   try {
//     const [listasResponse, acertosResponse] = await Promise.all([
//       fetchListasFeitas(token),
//       fetchAcertosErros(token),
//     ]);

//     return {
//       listas: listasResponse,
//       acertos: acertosResponse,
//     };
//   } catch (error) {
//     const err = error as AxiosError;
//     console.error("Erro ao buscar stats:", err.response?.data || err.message);
//     return null;
//   }
// }

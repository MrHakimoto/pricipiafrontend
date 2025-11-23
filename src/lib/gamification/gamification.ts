//lib/gamification/gamification.ts
import { api } from "../axios";

// --- Interfaces ---

export interface UserStatus {
  level: number;
  points: number;
  streak: number;
  next_level_threshold: number;
  points_needed: number;
  progress_percentage: number;
  rank_title: string;
}

export interface ProgressDataPoint {
  date: string;
  total_score: number; // Eixo Y
  daily_gain: number;
}

export interface HistoryItem {
  id: number;
  amount: number;
  action_type: string;
  description: string;
  created_at: string;
}

export interface LeaderboardItem {
  rank: number;
  name: string;
  avatar: string | null;
  points: number;
  level: number;
  title: string;
}

// --- Funções ---

// 1. Status do Usuário (Header do Painel)
export const getGamificationStatus = async (token: string): Promise<UserStatus> => {
  const response = await api.get<UserStatus>("/gamification/status", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 2. Dados para o Gráfico (Chart.js / Recharts)
export const getGamificationProgress = async (token: string): Promise<ProgressDataPoint[]> => {
  const response = await api.get<ProgressDataPoint[]>("/gamification/progress", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 3. Histórico de Pontos
export const getGamificationHistory = async (token: string, page = 1) => {
  const response = await api.get("/gamification/history", {
    params: { page },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // Retorna objeto paginado
};

// 4. Ranking
export const getLeaderboard = async (token: string) => {
  const response = await api.get<{ top_10: LeaderboardItem[], my_rank: number }>("/gamification/leaderboard", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
// lib/gamification/gamification.ts
import { api } from "../axios";

// --- Interfaces ---

export interface UserStatus {
  level: number;
  points: number;
  streak: number;
  next_level_threshold: number;
  points_needed: number;
  progress_percentage: number;
  rank_title?: string | null;
}

export interface ProgressDataPoint {
  date: string;
  total_score: number;
  daily_gain: number;
}

export interface HistoryItem {
  id: number;
  amount: number;
  action_type: string;
  description: string | null;
  created_at: string;
}

export interface LeaderboardItem {
  rank: number;
  name: string;
  avatar: string | null;
  points: number;
  level: number;
  title?: string | null;
}

export interface LeaderboardResponse {
  top_10: LeaderboardItem[];
  my_rank: number;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

// --- Funções ---

export const getGamificationStatus = async (
  token: string
): Promise<UserStatus> => {
  const response = await api.get<UserStatus>("/gamification/status", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export const getGamificationProgress = async (
  token: string
): Promise<ProgressDataPoint[]> => {
  const response = await api.get<ProgressDataPoint[]>("/gamification/progress", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export const getGamificationHistory = async (
  token: string,
  page = 1
): Promise<PaginatedResponse<HistoryItem>> => {
  const response = await api.get<PaginatedResponse<HistoryItem>>(
    "/gamification/history",
    {
      params: { page },
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
};

export const getLeaderboard = async (
  token: string
): Promise<LeaderboardResponse> => {
  const response = await api.get<LeaderboardResponse>(
    "/gamification/leaderboard",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
};
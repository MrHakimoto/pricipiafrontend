import { api } from "../axios";
import type { AxiosError } from "axios";

export interface CheckinStatusResponse {
  id: number;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  has_checked_in_today: boolean;
  week_checkins: string[];
  month_checkins: string[];
  today: string;
  month: string;
  month_label: string;
}

export interface CheckinStatusParams {
  month?: string;
}

export interface CheckinDailyResponse {
  message: string;
  checkin?: {
    id: number;
    user_id: number;
    checkin_date: string;
    created_at?: string | null;
    updated_at?: string | null;
  };
  streak?: {
    id: number;
    user_id: number;
    current_streak: number;
    longest_streak: number;
    last_checkin_date: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
  status?: CheckinStatusResponse;
}

export const checkinStatus = async (
  token: string,
  params?: CheckinStatusParams,
): Promise<CheckinStatusResponse> => {
  if (!token) throw new Error("Token não fornecido.");

  const response = await api.get<CheckinStatusResponse>("/checkin-status", {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const checkinDaily = async (
  token: string,
): Promise<CheckinDailyResponse> => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.post<CheckinDailyResponse>(
      "/checkin",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<CheckinDailyResponse>;

    if (err.response?.status === 409 && err.response.data) {
      return err.response.data;
    }

    console.error("Erro ao realizar o check-in:", err);
    throw new Error("Falha ao realizar o check-in.");
  }
};

export const getUser = async (token: string) => {
  if (!token) throw new Error("Token não fornecido.");

  try {
    const response = await api.get("/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    throw new Error("Falha ao buscar o usuário.");
  }
};
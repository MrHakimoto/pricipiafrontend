import { api } from "@/lib/axios";
import type { AxiosError } from "axios";

export type MasteryStatus =
  | "dominado"
  | "estavel"
  | "em_construcao"
  | "critico"
  | "poucos_dados";

export type RecommendationSeverity = "info" | "warning" | "critical" | "success";

export interface MetricPeriod {
  days: number;
  start_date: string;
  end_date: string;
}

export interface MetricSummary {
  questions_answered: number;
  questions_correct: number;
  questions_wrong: number;
  accuracy_rate: number;
  lessons_completed: number;
  seconds_studied: number;
  hours_studied: number;
  current_streak: number;
  longest_streak: number;
}

export interface MetricGamification {
  points: number;
  level: number;
  current_streak: number;
  ranking_global: number | null;
  points_to_next_level: number | null;
}

export interface MetricEvolutionItem {
  date: string;
  label: string;
  questions_answered: number;
  questions_correct: number;
  questions_wrong: number;
  accuracy_rate: number;
  seconds_studied: number;
  lessons_completed: number;
}

export interface SubjectMetric {
  id: number | null;
  name: string;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy_rate: number;
  status: MasteryStatus;
}

export interface TopicMetric {
  id: number;
  name: string;
  subject: string | null;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy_rate: number;
  status: MasteryStatus;
}

export interface RecentListMetric {
  id: number;
  lista_id: number;
  name: string;
  type: string;
  completed_at: string | null;
  correct: number;
  wrong: number;
  total: number;
  accuracy_rate: number;
}

export interface MetricRecommendation {
  title: string;
  description: string;
  action_label: string;
  href: string | null;
  severity: RecommendationSeverity;
}

export interface UserMetricsDashboard {
  periodo: MetricPeriod;
  resumo: MetricSummary;
  gamification: MetricGamification;
  evolution: MetricEvolutionItem[];
  subjects: SubjectMetric[];
  topics: TopicMetric[];
  strengths: TopicMetric[];
  weaknesses: TopicMetric[];
  recent_lists: RecentListMetric[];
  recommendation: MetricRecommendation;
}

export async function getUserMetrics(
  token: string,
  days = 30
): Promise<UserMetricsDashboard> {
  try {
    const cleanToken = token?.replace(/^Bearer\s+/i, "");

    const response = await api.get<UserMetricsDashboard>("/me/metrics", {
      params: { days },
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
    });

    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error(
      "Erro ao buscar métricas do usuário:",
      err.response?.data || err.message
    );

    throw new Error("Não foi possível carregar suas métricas.");
  }
}
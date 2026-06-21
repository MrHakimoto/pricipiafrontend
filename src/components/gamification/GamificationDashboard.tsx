// components/gamification/GamificationDashboard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Flame,
  TrendingUp,
  Medal,
  History,
  Loader2,
  AlertCircle,
  RefreshCw,
  Star,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSession } from "next-auth/react";

import {
  getGamificationHistory,
  getGamificationProgress,
  getGamificationStatus,
  getLeaderboard,
  HistoryItem,
  LeaderboardResponse,
  ProgressDataPoint,
  UserStatus,
} from "@/lib/gamification/gamification";
import StreakMonthCalendarContainer from "../home/metricas/StreakMonthCalendarContainer";

type DashboardState = {
  status: UserStatus | null;
  progress: ProgressDataPoint[];
  leaderboard: LeaderboardResponse | null;
  history: HistoryItem[];
};

const initialState: DashboardState = {
  status: null,
  progress: [],
  leaderboard: null,
  history: [],
};

function formatAction(action: string): string {
  const map: Record<string, string> = {
    assistir_aula: "Assistiu aula",
    responder_questao: "Respondeu questão",
    resposta_correta: "Resposta correta",
    concluir_modulo: "Concluiu módulo",
    streak_7_dias: "Streak de 7 dias",
    streak_30_dias: "Streak de 30 dias",
    postar_duvida: "Postou dúvida",
    responder_duvida: "Respondeu dúvida",
    comentar_aula: "Comentou em aula",
    curtir: "Curtiu conteúdo",
    report_valido: "Report confirmado",
    report_invalido: "Report analisado",
    fazer_simulado: "Fez simulado",
  };

  return map[action] ?? action.replaceAll("_", " ");
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function AvatarBubble({
  name,
  avatar,
  rank,
}: {
  name: string;
  avatar?: string | null;
  rank: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative h-10 w-10 shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E00D0] text-sm font-black text-white">
          {initials || "A"}
        </div>
      )}

      <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#020B1F] px-1 text-[10px] font-black text-[#0E00D0] ring-1 ring-white/10">
        {rank}
      </span>
    </div>
  );
}

function formatFullDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string | null;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#020B1F]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0E00D0]/10 text-[#0E00D0] dark:bg-[#0E00D0]/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#020B1F]">
      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
        <Loader2 className="h-5 w-5 animate-spin text-[#0E00D0]" />
        <span className="font-medium">Carregando métricas...</span>
      </div>
    </section>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#020B1F]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-950 dark:text-white">
              Não foi possível carregar suas métricas.
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tente novamente em alguns instantes.
            </p>
          </div>
        </div>

        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E00D0] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    </section>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center rounded-3xl bg-gray-50 px-6 text-center text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
      Seus pontos aparecerão aqui conforme você assistir aulas, responder
      questões e avançar na plataforma.
    </div>
  );
}

export function GamificationDashboard() {
  const [data, setData] = useState<DashboardState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { data: session, status: sessionStatus } = useSession();
  const token = session?.laravelToken;

  async function loadData() {
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus !== "authenticated" || !token) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      const [status, progress, leaderboard, history] = await Promise.all([
        getGamificationStatus(token),
        getGamificationProgress(token),
        getLeaderboard(token),
        getGamificationHistory(token, 1),
      ]);

      setData({
        status,
        progress,
        leaderboard,
        history: history.data ?? [],
      });
    } catch (error) {
      console.error("Erro ao carregar gamificação:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [sessionStatus, token]);

  const chartData = useMemo(() => {
    return data.progress.map((item) => ({
      ...item,
      label: formatDate(item.date),
    }));
  }, [data.progress]);

  if (isLoading || sessionStatus === "loading") {
    return <LoadingState />;
  }

  if (hasError || !data.status) {
    return <ErrorState onRetry={loadData} />;
  }

  const status = data.status;
  const leaderboard = data.leaderboard;
  const progressPercentage = Math.min(
    100,
    Math.max(0, status.progress_percentage),
  );

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#020B1F]">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[#0E00D0]/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#0E00D0]">
                Métricas do aluno
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                Nível {status.level} — {status.rank_title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300 sm:text-base">
                Acompanhe seus pontos, evolução, ofensiva e posição no ranking
                do Principia.
              </p>
            </div>

            <div className="w-full rounded-3xl bg-[#0E00D0] p-5 text-white shadow-lg shadow-[#0E00D0]/20 sm:w-auto sm:min-w-[260px]">
              <p className="text-sm font-medium text-white/80">Pontuação</p>

              <p className="mt-1 text-4xl font-black">{status.points}π</p>

              <p className="mt-1 text-sm text-white/80">
                Faltam {status.points_needed}π para o próximo nível
              </p>
            </div>
          </div>

          <div className="relative mt-8">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-200">
                Progresso do nível
              </span>

              <span className="font-semibold text-[#0E00D0]">
                {progressPercentage}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-[#0E00D0] transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pontos totais"
          value={`${status.points}π`}
          subtitle="Saldo acumulado"
          icon={Trophy}
        />

        <StatCard
          title="Nível atual"
          value={status.level}
          subtitle={status.rank_title ?? "Sem ranking ainda"}
          icon={Medal}
        />

        <StatCard
          title="Ofensiva"
          value={`${status.streak} dias`}
          subtitle="Sequência atual"
          icon={Flame}
        />

        <StatCard
          title="Meu ranking"
          value={leaderboard?.my_rank ? `#${leaderboard.my_rank}` : "—"}
          subtitle="Posição geral"
          icon={TrendingUp}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* COLUNA ESQUERDA */}
        <div className="flex flex-col gap-5">
          {/* Evolução + calendário */}
          <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#020B1F] sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">
                Evolução e ofensiva
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Acompanhe seus pontos e os dias em que manteve sua sequência.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              {/* Gráfico */}
              <div className="min-h-[280px] rounded-3xl bg-gray-50 p-4 dark:bg-white/[0.04]">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-gray-950 dark:text-white">
                    Evolução de pontos
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pontuação acumulada.
                  </p>
                </div>

                <div className="h-56">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{
                          top: 8,
                          right: 8,
                          left: -16,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="pointsGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0E00D0"
                              stopOpacity={0.28}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0E00D0"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" opacity={0.14} />

                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          minTickGap={18}
                          fontSize={11}
                        />

                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={38}
                          fontSize={11}
                          tickFormatter={(value) => `${value}π`}
                        />

                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "total_score")
                              return [`${value}π`, "Total"];
                            if (name === "daily_gain")
                              return [`${value}π`, "Ganho diário"];
                            return [value, name];
                          }}
                          labelFormatter={(_, payload) => {
                            const date = payload?.[0]?.payload?.date;
                            return date ? formatFullDate(date) : "";
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="total_score"
                          stroke="#0E00D0"
                          strokeWidth={2.5}
                          fill="url(#pointsGradient)"
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState />
                  )}
                </div>
              </div>

              {/* Calendário */}
              <StreakMonthCalendarContainer />
            </div>
          </div>

          {/* Histórico recente AGORA VAI PRA ESQUERDA, embaixo */}
          <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#020B1F] sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <History className="h-5 w-5 text-[#0E00D0]" />

              <div>
                <h2 className="text-xl font-bold text-gray-950 dark:text-white">
                  Histórico recente
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Últimas movimentações de pontos.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[165px] overflow-y-auto pr-1">
              {data.history.length ? (
                data.history.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-black/5 p-4 dark:border-white/10"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0E00D0]/10 text-[#0E00D0]">
                      <Star className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-950 dark:text-white">
                        {item.description || formatAction(item.action_type)}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFullDate(item.created_at)}
                      </p>
                    </div>

                    <div className="text-right text-lg font-black text-[#0E00D0]">
                      +{item.amount}π
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  Nenhuma transação recente encontrada.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#020B1F] sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              Ranking
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Top 10 alunos por pontuação.
            </p>
          </div>

          <div className="space-y-3">
            {leaderboard?.top_10?.length ? (
              leaderboard.top_10.map((item) => (
                <div
                  key={`${item.rank}-${item.name}`}
                  className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-white/5"
                >
                  <AvatarBubble
                    name={item.name}
                    avatar={item.avatar}
                    rank={item.rank}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-950 dark:text-white">
                      {item.name}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Nível {item.level} · {item.title}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white px-3 py-1.5 text-right dark:bg-[#020B1F]">
                    <p className="font-black text-gray-950 dark:text-white">
                      {item.points}π
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                Ranking ainda sem dados.
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}

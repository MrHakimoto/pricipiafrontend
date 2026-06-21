"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Flame,
  Gauge,
  Loader2,
  Medal,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getUserMetrics,
  type MasteryStatus,
  type MetricRecommendation,
  type TopicMetric,
  type UserMetricsDashboard,
} from "@/lib/metricas/userMetrics";

const PERIODS = [
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
  { label: "180 dias", value: 180 },
  { label: "1 ano", value: 365 },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function formatPercent(value: number | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })}%`;
}

function formatHours(value: number | null | undefined) {
  const hours = Number(value ?? 0);

  if (hours < 1 && hours > 0) {
    return `${Math.round(hours * 60)} min`;
  }

  return `${hours.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} h`;
}

function getStatusLabel(status: MasteryStatus) {
  const labels: Record<MasteryStatus, string> = {
    dominado: "Dominado",
    estavel: "Estável",
    em_construcao: "Em construção",
    critico: "Crítico",
    poucos_dados: "Poucos dados",
  };

  return labels[status];
}

function getStatusClass(status: MasteryStatus) {
  const classes: Record<MasteryStatus, string> = {
    dominado:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    estavel:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    em_construcao:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    critico:
      "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    poucos_dados:
      "border-slate-400/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  };

  return classes[status];
}

function getRecommendationClass(severity: MetricRecommendation["severity"]) {
  const classes = {
    info: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-200",
    warning:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200",
    critical:
      "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200",
    success:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  };

  return classes[severity];
}

function MetricSkeleton() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#07111f]">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-[#0E00D0]" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Carregando métricas...
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5"
          />
        ))}
      </div>

      <div className="mt-4 h-80 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#07111f]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E00D0]/10 text-[#0E00D0]">
        <BarChart3 className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
        Ainda não há dados suficientes
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        Resolva questões, finalize listas e assista aulas para que o painel
        consiga formar um diagnóstico de desempenho.
      </p>

      <Link
        href="/exercicios"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0E00D0] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Resolver questões
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone: "blue" | "green" | "rose" | "amber" | "purple" | "slate";
}

function StatCard({ title, value, description, icon: Icon, tone }: StatCardProps) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    purple: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#07111f]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <strong className="mt-3 block text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </strong>
        </div>

        <div className={cn("rounded-2xl p-3", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </article>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: MetricRecommendation;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border p-5 shadow-sm",
        getRecommendationClass(recommendation.severity)
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10">
            {recommendation.severity === "critical" ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
          </div>

          <div>
            <h2 className="text-base font-black">Próxima melhor ação</h2>
            <p className="mt-1 text-lg font-bold">{recommendation.title}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 opacity-85">
              {recommendation.description}
            </p>
          </div>
        </div>

        {recommendation.href && (
          <Link
            href={recommendation.href}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white"
          >
            {recommendation.action_label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

function EvolutionChart({ data }: { data: UserMetricsDashboard["evolution"] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#07111f]">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Evolução no período
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acertos, erros e taxa de aproveitamento por dia.
          </p>
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-white/10" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <YAxis tickLine={false} axisLine={false} className="text-xs" />
            <Tooltip
              cursor={{ opacity: 0.12 }}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(148, 163, 184, 0.25)",
              }}
              formatter={(value, name) => {
                const label =
                  name === "questions_correct"
                    ? "Acertos"
                    : name === "questions_wrong"
                    ? "Erros"
                    : "Questões";

                return [value, label];
              }}
            />
            <Bar dataKey="questions_correct" stackId="a" radius={[8, 8, 0, 0]} />
            <Bar dataKey="questions_wrong" stackId="a" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AccuracyLineChart({ data }: { data: UserMetricsDashboard["evolution"] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#07111f]">
      <h2 className="text-lg font-black text-slate-950 dark:text-white">
        Taxa de acerto
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        O objetivo é estabilizar acima de 70% antes de intensificar simulados.
      </p>

      <div className="mt-5 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-white/10" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
            <YAxis tickLine={false} axisLine={false} className="text-xs" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(148, 163, 184, 0.25)",
              }}
              formatter={(value) => [`${value}%`, "Taxa"]}
            />
            <Line
              type="monotone"
              dataKey="accuracy_rate"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TopicList({
  title,
  description,
  data,
  type,
}: {
  title: string;
  description: string;
  data: TopicMetric[];
  type: "strong" | "weak";
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#07111f]">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-2xl p-3",
            type === "strong"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
          )}
        >
          {type === "strong" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {data.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
            Ainda não há volume estatístico suficiente.
          </p>
        ) : (
          data.map((topic) => (
            <div key={topic.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                    {topic.name}
                  </p>
                  {topic.subject && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {topic.subject}
                    </p>
                  )}
                </div>

                <span className="shrink-0 text-sm font-black text-slate-950 dark:text-white">
                  {formatPercent(topic.accuracy_rate)}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full",
                    type === "strong" ? "bg-emerald-500" : "bg-rose-500"
                  )}
                  style={{ width: `${Math.min(100, topic.accuracy_rate)}%` }}
                />
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {topic.correct}/{topic.attempts} acertos
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SubjectTable({ data }: { data: UserMetricsDashboard["subjects"] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#07111f]">
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">
          Matriz por assunto
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Uma visão de domínio, volume e aproveitamento.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[1.6fr_.7fr_.7fr_.7fr_.9fr] border-b border-slate-200 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:border-white/10">
            <span>Assunto</span>
            <span className="text-right">Tentativas</span>
            <span className="text-right">Acertos</span>
            <span className="text-right">Taxa</span>
            <span className="text-right">Status</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {data.length === 0 ? (
              <p className="py-5 text-sm text-slate-500 dark:text-slate-400">
                Nenhum assunto registrado no período.
              </p>
            ) : (
              data.map((item) => (
                <div
                  key={`${item.id}-${item.name}`}
                  className="grid grid-cols-[1.6fr_.7fr_.7fr_.7fr_.9fr] items-center py-4 text-sm"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {item.name}
                  </span>
                  <span className="text-right text-slate-500 dark:text-slate-400">
                    {item.attempts}
                  </span>
                  <span className="text-right text-slate-500 dark:text-slate-400">
                    {item.correct}
                  </span>
                  <span className="text-right font-black text-slate-950 dark:text-white">
                    {formatPercent(item.accuracy_rate)}
                  </span>
                  <span className="text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                        getStatusClass(item.status)
                      )}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecentSimulados({ data }: { data: UserMetricsDashboard["recent_lists"] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#07111f]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Simulados recentes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aproveitamento nas últimas provas e simulados.
          </p>
        </div>

        <Trophy className="h-5 w-5 text-amber-500" />
      </div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
            Nenhum simulado finalizado ainda.
          </p>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 p-4 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.correct}/{item.total} acertos
                  </p>
                </div>

                <span className="shrink-0 text-sm font-black text-slate-950 dark:text-white">
                  {formatPercent(item.accuracy_rate)}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#0E00D0]"
                  style={{ width: `${Math.min(100, item.accuracy_rate)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Header({
  days,
  setDays,
}: {
  days: number;
  setDays: (days: number) => void;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#0E00D0] dark:text-blue-300">
          Métricas do usuário
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Diagnóstico de desempenho
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Acompanhe acertos, erros, constância, simulados e lacunas de domínio.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((period) => (
          <button
            key={period.value}
            type="button"
            onClick={() => setDays(period.value)}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm font-bold transition",
              days === period.value
                ? "border-[#0E00D0] bg-[#0E00D0] text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#0E00D0]/40 hover:text-[#0E00D0] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            )}
          >
            {period.label}
          </button>
        ))}
      </div>
    </header>
  );
}

const PerformanceDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<UserMetricsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const token =
    (session as any)?.laravelToken ||
    (session as any)?.accessToken ||
    (session as any)?.user?.laravelToken;

  useEffect(() => {
    if (status === "loading") return;

    if (!token) {
      setLoading(false);
      setErro("Sessão não encontrada.");
      return;
    }

    let active = true;

    setLoading(true);
    setErro(null);

    getUserMetrics(token, days)
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((error) => {
        if (!active) return;
        setErro(error.message || "Erro ao carregar métricas.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, status, days]);

  const stats = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: "Taxa de acerto",
        value: formatPercent(data.resumo.accuracy_rate),
        description: `${formatNumber(data.resumo.questions_correct)} acertos em ${formatNumber(data.resumo.questions_answered)} questões.`,
        icon: Target,
        tone: "blue" as const,
      },
      {
        title: "Questões erradas",
        value: formatNumber(data.resumo.questions_wrong),
        description: "Erros registrados no período selecionado.",
        icon: XCircle,
        tone: "rose" as const,
      },
      {
        title: "Tempo estudado",
        value: formatHours(data.resumo.hours_studied),
        description: `${formatNumber(data.resumo.lessons_completed)} aulas concluídas no período.`,
        icon: BookOpen,
        tone: "purple" as const,
      },
      {
        title: "Sequência",
        value: `${formatNumber(data.resumo.current_streak)} dias`,
        description: `Maior sequência: ${formatNumber(data.resumo.longest_streak)} dias.`,
        icon: Flame,
        tone: "amber" as const,
      },
      {
        title: "Pontos π",
        value: formatNumber(data.gamification.points),
        description: `Nível ${formatNumber(data.gamification.level)} na gamificação.`,
        icon: Sparkles,
        tone: "green" as const,
      },
      {
        title: "Ranking",
        value: data.gamification.ranking_global
          ? `#${formatNumber(data.gamification.ranking_global)}`
          : "—",
        description: "Posição aproximada pelo total de pontos.",
        icon: Medal,
        tone: "slate" as const,
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Header days={days} setDays={setDays} />
        <MetricSkeleton />
      </div>
    );
  }

  if (erro) {
    return (
      <section className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-700 dark:text-rose-200">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <strong>Não foi possível carregar as métricas.</strong>
        </div>
        <p className="mt-2 text-sm opacity-85">{erro}</p>
      </section>
    );
  }

  if (!data) {
    return <EmptyState />;
  }

  const hasAnyMetric =
    data.resumo.questions_answered > 0 ||
    data.resumo.lessons_completed > 0 ||
    data.resumo.seconds_studied > 0;

  if (!hasAnyMetric) {
    return (
      <div className="space-y-6">
        <Header days={days} setDays={setDays} />
        <EmptyState />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <Header days={days} setDays={setDays} />

      <RecommendationCard recommendation={data.recommendation} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_.9fr]">
        <EvolutionChart data={data.evolution} />
        <AccuracyLineChart data={data.evolution} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopicList
          title="Pontos fortes"
          description="Tópicos com maior domínio estatístico."
          data={data.strengths}
          type="strong"
        />

        <TopicList
          title="Pontos de atenção"
          description="Tópicos que merecem revisão prioritária."
          data={data.weaknesses}
          type="weak"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_.75fr]">
        <SubjectTable data={data.subjects} />
        <RecentSimulados data={data.recent_lists} />
      </div>
    </section>
  );
};

export { PerformanceDashboard };
export default PerformanceDashboard;
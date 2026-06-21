"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, easeInOut } from "framer-motion";
import {
  Search,
  Clock,
  CheckCircle,
  PlayCircle,
  Tag,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import { getListOficial } from "@/lib/questions/list";
import Link from "next/link";
import ConteudoSkeleton from "@/components/Skeletons/ConteudoSkeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Resolucao = {
  id: number;
  user_id: number;
  lista_id: number;
  tentativa_numero: number;
  status: "iniciado" | "concluido" | "pausado";
  score_final: number | null;
  total_questoes: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  respostas_count: number;
};

type Lista = {
  id: number;
  name: string;
  descricao?: string;
  time: number;
  questoes_count: number;
  tipo: string;
  frentes: Array<{ nome: string }>;
  assuntos: Array<{ nome: string }>;
  topicos: Array<{ nome: string }>;
  user?: {
    name: string;
  };
  resolucoes: Resolucao[];
};

type ProgressStatus = "pending" | "in-progress" | "completed";
type FilterType = "all" | "pending" | "in-progress" | "completed";

type UserProgress = {
  status: ProgressStatus;
  responses: number;
  progress: number;
};

type TagItem = {
  nome: string;
  type: "frente" | "assunto" | "topico";
};

type ListaViewModel = Lista & {
  progressData: UserProgress;
  tags: TagItem[];
};

type LogoIconProps = {
  size?: number;
  className?: string;
};

type CircularProgressProps = {
  progress: number;
  status: ProgressStatus;
};

type FilterButtonConfig = {
  key: FilterType;
  label: string;
  count: number;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
};

/**
 * Cache em escopo de módulo.
 *
 * Isto evita:
 * 1. refetch ao alternar filtros;
 * 2. refetch por pequenos re-renders;
 * 3. duplicação de chamada em cenários de montagem dupla no desenvolvimento.
 */
const listasCacheByToken = new Map<string, Lista[]>();
const listasInFlightByToken = new Map<string, Promise<Lista[]>>();

const normalizeListasResponse = (response: unknown): Lista[] => {
  if (Array.isArray(response)) {
    return response as Lista[];
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: Lista[] }).data;
  }

  if (
    response &&
    typeof response === "object" &&
    "lista_info" in response &&
    Array.isArray((response as { lista_info?: unknown }).lista_info)
  ) {
    return (response as { lista_info: Lista[] }).lista_info;
  }

  return [];
};

const fetchListasOficiaisCached = async (token: string): Promise<Lista[]> => {
  const cached = listasCacheByToken.get(token);

  if (cached) {
    return cached;
  }

  const inFlight = listasInFlightByToken.get(token);

  if (inFlight) {
    return inFlight;
  }

  const request = getListOficial(token)
    .then((response) => {
      const listas = normalizeListasResponse(response);
      listasCacheByToken.set(token, listas);
      return listas;
    })
    .finally(() => {
      listasInFlightByToken.delete(token);
    });

  listasInFlightByToken.set(token, request);

  return request;
};

const LogoIcon = ({ size = 20, className = "" }: LogoIconProps) => {
  return (
    <svg
      viewBox="0 0 360 360"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M27 47 L332 47 L256 179 L179 180 L217 245 L180 311 L104 180 L179 180 L218 113 L64 112 Z"
        stroke="currentColor"
        strokeWidth="28"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

const getProgressColor = (status: ProgressStatus) => {
  switch (status) {
    case "completed":
      return "text-emerald-400";
    case "in-progress":
      return "text-blue-400";
    case "pending":
    default:
      return "text-amber-400";
  }
};

const getStatusProps = (status: ProgressStatus) => {
  switch (status) {
    case "completed":
      return {
        text: "Finalizado",
        icon: CheckCircle,
        dotClass: "bg-emerald-400",
        textClass: "text-emerald-300",
        bgClass: "bg-emerald-500/10 border-emerald-400/20",
      };
    case "in-progress":
      return {
        text: "Em progresso",
        icon: PlayCircle,
        dotClass: "bg-blue-400",
        textClass: "text-blue-300",
        bgClass: "bg-blue-500/10 border-blue-400/20",
      };
    case "pending":
    default:
      return {
        text: "Pendente",
        icon: Clock,
        dotClass: "bg-amber-400",
        textClass: "text-amber-300",
        bgClass: "bg-amber-500/10 border-amber-400/20",
      };
  }
};

const calculateUserProgress = (lista: Lista): UserProgress => {
  if (!lista.resolucoes || lista.resolucoes.length === 0) {
    return {
      status: "pending",
      responses: 0,
      progress: 0,
    };
  }

  const lastAttempt = lista.resolucoes.reduce((prev, current) =>
    current.tentativa_numero > prev.tentativa_numero ? current : prev
  );

  const totalQuestions = lista.questoes_count || 0;
  const answeredQuestions = lastAttempt.respostas_count || 0;

  let status: ProgressStatus = "pending";

  if (answeredQuestions >= totalQuestions && totalQuestions > 0) {
    status = "completed";
  } else if (answeredQuestions > 0 || lastAttempt.status === "iniciado") {
    status = "in-progress";
  }

  const progress =
    totalQuestions > 0
      ? Math.min(100, (answeredQuestions / totalQuestions) * 100)
      : 0;

  return {
    status,
    responses: answeredQuestions,
    progress: status === "completed" ? 100 : progress,
  };
};

const getListaTags = (lista: Lista): TagItem[] => {
  return [
    ...(lista.frentes || []).map((frente) => ({
      nome: frente.nome,
      type: "frente" as const,
    })),
    ...(lista.assuntos || []).map((assunto) => ({
      nome: assunto.nome,
      type: "assunto" as const,
    })),
    ...(lista.topicos || []).map((topico) => ({
      nome: topico.nome,
      type: "topico" as const,
    })),
  ];
};

const CircularProgress = ({ progress, status }: CircularProgressProps) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const color = getProgressColor(status);
  const progressText =
    status === "completed" ? "100%" : `${Math.round(progress)}%`;

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle
          className="text-slate-700/80"
          strokeWidth="5"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />

        <motion.circle
          className={color}
          strokeWidth="5"
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.15,
            ease: "easeOut",
          }}
        />
      </svg>

      <div
        className={`absolute flex items-center justify-center text-sm font-extrabold ${color}`}
      >
        {status === "completed" ? <CheckCircle size={19} /> : progressText}
      </div>
    </div>
  );
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.035, 0.35),
      duration: 0.28,
      ease: easeInOut,
    },
  }),
};

const cardHover = {
  y: -4,
  transition: {
    type: "spring" as const,
    stiffness: 420,
    damping: 24,
  },
};

const ListaCard = ({
  lista,
  index,
}: {
  lista: ListaViewModel;
  index: number;
}) => {
  const statusProps = getStatusProps(lista.progressData.status);
  const StatusIcon = statusProps.icon;

  const visibleTags = lista.tags.slice(0, 4);
  const hiddenTagsCount = Math.max(0, lista.tags.length - visibleTags.length);

  return (
    <Link href={`listas-oficiais/${lista.id}`} className="group block">
      <motion.article
        className="relative flex min-h-[360px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#071326] shadow-[0_18px_60px_rgba(0,0,0,0.25)] transition-colors duration-300 hover:border-[#E60076]/70"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        whileHover={cardHover}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,0,118,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(77,161,255,0.12),transparent_35%)] opacity-80" />

        <div className="relative flex flex-1 flex-col p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#E60076] shadow-lg shadow-[#E60076]/20 transition-transform duration-300 group-hover:scale-105">
              <LogoIcon size={25} className="text-white" />
            </div>

            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusProps.bgClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusProps.dotClass}`} />
              <StatusIcon size={13} className={statusProps.textClass} />
              <span className={statusProps.textClass}>{statusProps.text}</span>
            </div>
          </div>

          <div className="min-h-[118px]">
            <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-white">
              {lista.name}
            </h3>

            {lista.descricao ? (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">
                {lista.descricao}
              </p>
            ) : (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
                Lista oficial de exercícios para treino dirigido e acompanhamento
                de progresso.
              </p>
            )}
          </div>

          {lista.tags.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Tag size={12} />
                Tags
              </div>

              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map((tag, tagIndex) => (
                  <span
                    key={`${lista.id}-${tag.type}-${tag.nome}-${tagIndex}`}
                    title={tag.nome}
                    className="max-w-[130px] truncate rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-xs font-medium text-slate-300"
                  >
                    {tag.nome}
                  </span>
                ))}

                {hiddenTagsCount > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-xs font-semibold text-slate-400">
                    +{hiddenTagsCount}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto pt-5">
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <LogoIcon size={13} className="text-slate-500" />
                  Questões
                </div>
                <div className="mt-1 text-lg font-black text-white">
                  {lista.questoes_count || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={13} />
                  Tempo
                </div>
                <div className="mt-1 text-lg font-black text-white">
                  {lista.time || 0}m
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
              <CircularProgress
                progress={lista.progressData.progress}
                status={lista.progressData.status}
              />

              <div className="text-right">
                <div className="text-2xl font-black text-white">
                  {lista.progressData.responses}
                  <span className="text-sm font-semibold text-slate-500">
                    /{lista.questoes_count || 0}
                  </span>
                </div>
                <div className="mt-0.5 text-xs font-medium text-slate-500">
                  respostas registradas
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
};

export default function ListaDeExercicios() {
  const [isLoading, setIsLoading] = useState(true);
  const [allListas, setAllListas] = useState<Lista[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();

  const token = session?.laravelToken;

  useDocumentTitle("Listas Oficiais");

  useEffect(() => {
    let isMounted = true;

    const getDados = async () => {
      if (status === "loading") {
        return;
      }

      if (status === "unauthenticated") {
        if (!isMounted) return;

        setError("Você precisa estar logado para ver as listas.");
        setAllListas([]);
        setIsLoading(false);
        return;
      }

      if (status !== "authenticated" || !token) {
        if (!isMounted) return;

        setAllListas([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const listasData = await fetchListasOficiaisCached(token);

        if (!isMounted) return;

        setAllListas(listasData);
      } catch (err) {
        console.error("Erro ao carregar listas:", err);

        if (!isMounted) return;

        setError("Falha ao carregar as listas.");
        setAllListas([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getDados();

    return () => {
      isMounted = false;
    };
  }, [status, token]);

  const listasViewModel = useMemo<ListaViewModel[]>(() => {
    return allListas.map((lista) => ({
      ...lista,
      progressData: calculateUserProgress(lista),
      tags: getListaTags(lista),
    }));
  }, [allListas]);

  const filterCounts = useMemo(() => {
    return listasViewModel.reduce(
      (acc, lista) => {
        acc.all += 1;
        acc[lista.progressData.status] += 1;
        return acc;
      },
      {
        all: 0,
        pending: 0,
        "in-progress": 0,
        completed: 0,
      } as Record<FilterType, number>
    );
  }, [listasViewModel]);

  const filteredListas = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return listasViewModel.filter((lista) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        lista.name.toLowerCase().includes(normalizedSearch) ||
        lista.descricao?.toLowerCase().includes(normalizedSearch) ||
        lista.frentes?.some((frente) =>
          frente.nome.toLowerCase().includes(normalizedSearch)
        ) ||
        lista.assuntos?.some((assunto) =>
          assunto.nome.toLowerCase().includes(normalizedSearch)
        ) ||
        lista.topicos?.some((topico) =>
          topico.nome.toLowerCase().includes(normalizedSearch)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeFilter === "all") {
        return true;
      }

      return lista.progressData.status === activeFilter;
    });
  }, [listasViewModel, searchTerm, activeFilter]);

  const filterButtons = useMemo<FilterButtonConfig[]>(
    () => [
      {
        key: "all",
        label: "Todos",
        icon: LogoIcon,
        count: filterCounts.all,
      },
      {
        key: "pending",
        label: "Pendente",
        icon: Clock,
        count: filterCounts.pending,
      },
      {
        key: "in-progress",
        label: "Em progresso",
        icon: PlayCircle,
        count: filterCounts["in-progress"],
      },
      {
        key: "completed",
        label: "Finalizado",
        icon: CheckCircle,
        count: filterCounts.completed,
      },
    ],
    [filterCounts]
  );

  const handleReload = () => {
    if (token) {
      listasCacheByToken.delete(token);
      listasInFlightByToken.delete(token);
    }

    window.location.reload();
  };

  if (isLoading || status === "loading") {
    return <ConteudoSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#00091A] p-8 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#071326] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <AlertTriangle size={26} />
          </div>

          <h1 className="text-xl font-black">Não foi possível carregar</h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {error}
          </p>

          <button
            onClick={handleReload}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E60076] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#c50064]"
          >
            <RotateCcw size={16} />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ExercisesHeader />

      <main className="min-h-screen bg-[#00091A] px-4 py-6 text-white sm:px-8 sm:py-10 md:px-16">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#071326] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E60076]/30 bg-[#E60076]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ff78bd]">
                  <LogoIcon size={14} />
                  Listas oficiais
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Escolha sua próxima lista
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Treine por listas organizadas, acompanhe seu progresso e
                  continue exatamente de onde parou.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                <div className="text-xs font-medium text-slate-500">
                  Total disponível
                </div>
                <div className="text-2xl font-black text-white">
                  {filterCounts.all}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={20}
                />

                <input
                  type="text"
                  placeholder="Buscar por nome, descrição, frente, assunto ou tópico..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#020817] py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-[#E60076]/70 focus:ring-4 focus:ring-[#E60076]/10"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
                {filterButtons.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.key;

                  return (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-all duration-300 ${
                        isActive
                          ? "border-[#E60076] bg-[#E60076] text-white shadow-lg shadow-[#E60076]/20"
                          : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-[#E60076]/40 hover:bg-[#E60076]/10"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{filter.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {filteredListas.length === 0 ? (
            <section className="rounded-[2rem] border border-white/10 bg-[#071326] px-6 py-16 text-center">
              <LogoIcon size={70} className="mx-auto mb-5 text-slate-600" />

              <h2 className="text-xl font-black text-white">
                Nenhuma lista encontrada
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                {searchTerm || activeFilter !== "all"
                  ? "Não há listas compatíveis com os filtros selecionados."
                  : "Nenhuma lista oficial está disponível no momento."}
              </p>

              {(searchTerm || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setActiveFilter("all");
                  }}
                  className="mt-6 rounded-2xl border border-[#E60076]/40 bg-[#E60076]/10 px-5 py-2.5 text-sm font-bold text-[#ff78bd] transition-colors hover:bg-[#E60076]/20"
                >
                  Limpar filtros
                </button>
              )}
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredListas.map((lista, index) => (
                <ListaCard key={lista.id} lista={lista} index={index} />
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
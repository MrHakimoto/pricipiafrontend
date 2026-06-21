"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, easeInOut } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  PencilLine,
  PlayCircle,
  Plus,
  Search,
} from "lucide-react";

import { api } from "@/lib/axios";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import ConteudoSkeleton from "@/components/Skeletons/ConteudoSkeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Resolucao = {
  id: number;
  user_id: number;
  lista_id: number;
  tentativa_numero: number;
  status: "iniciado" | "terminado" | "finalizado";
  score_final: number | null;
  total_questoes: number | null;
  tempo_escolhido?: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  respostas_count: number;
};

type Lista = {
  id: number;
  user_id?: number;
  name?: string;
  nome?: string;
  descricao?: string | null;
  time?: number | null;
  questoes_count?: number | null;
  total_questoes?: number | null;
  tipo?: string | null;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  frentes?: Array<{ nome: string }>;
  assuntos?: Array<{ nome: string }>;
  topicos?: Array<{ nome: string }>;
  data_criacao?: string | null;
  data_atualizacao?: string | null;
  user?: {
    name: string;
  };
  resolucoes?: Resolucao[];
};

type FilterType = "all" | "pending" | "in-progress" | "completed";

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.045,
      duration: 0.28,
      ease: easeInOut,
    },
  }),
};

function authHeaders(token?: string) {
  if (!token) return {};

  return {
    Authorization: `Bearer ${String(token)
      .replace(/^Bearer\s+/i, "")
      .trim()}`,
  };
}

function isListaAvulsa(lista: Lista) {
  return (
    String(lista.tipo || "")
      .toLowerCase()
      .trim() === "avulsa"
  );
}

function normalizeListas(payload: any): Lista[] {
  let listas: Lista[] = [];

  if (Array.isArray(payload)) listas = payload;
  else if (Array.isArray(payload?.data)) listas = payload.data;
  else if (Array.isArray(payload?.listas)) listas = payload.listas;
  else if (Array.isArray(payload?.data?.listas)) listas = payload.data.listas;
  else if (Array.isArray(payload?.lista_info)) listas = payload.lista_info;

  return listas.filter((lista) => !isListaAvulsa(lista));
}

function getListaName(lista: Lista) {
  return lista.name ?? lista.nome ?? "Lista sem nome";
}

function getTotalQuestoes(lista: Lista) {
  return Number(lista.questoes_count ?? lista.total_questoes ?? 0);
}

function getLastAttempt(lista: Lista): Resolucao | null {
  if (!Array.isArray(lista.resolucoes) || lista.resolucoes.length === 0) {
    return null;
  }

  return lista.resolucoes.reduce((previous, current) =>
    current.tentativa_numero > previous.tentativa_numero ? current : previous,
  );
}

function getListaTimeMinutes(lista: Lista): number | null {
  const time = Number(lista.time);

  if (Number.isFinite(time) && time > 0) {
    return time;
  }

  const lastAttempt = getLastAttempt(lista);
  const tempoEscolhido = Number(lastAttempt?.tempo_escolhido);

  if (Number.isFinite(tempoEscolhido) && tempoEscolhido > 0) {
    return tempoEscolhido;
  }

  const totalQuestoes = getTotalQuestoes(lista);

  if (totalQuestoes > 0) {
    return totalQuestoes * 3;
  }

  return null;
}

function formatTime(minutes?: number | null) {
  const value = Number(minutes ?? 0);

  if (!value || value <= 0) return "Sem tempo definido";
  if (value < 60) return `${value} min`;

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}min`;
}

function getListaTags(lista: Lista) {
  return [
    ...(lista.frentes || []).map((item) => item.nome),
    ...(lista.assuntos || []).map((item) => item.nome),
    ...(lista.topicos || []).map((item) => item.nome),
  ].filter(Boolean);
}
function getUserProgress(lista: Lista) {
  if (!lista.resolucoes || lista.resolucoes.length === 0) {
    return {
      status: "pending" as const,
      responses: 0,
      progress: 0,
      lastAttempt: null as Resolucao | null,
    };
  }

  const lastAttempt = getLastAttempt(lista);

  if (!lastAttempt) {
    return {
      status: "pending" as const,
      responses: 0,
      progress: 0,
      lastAttempt: null as Resolucao | null,
    };
  }

  const totalQuestions = getTotalQuestoes(lista);
  const answeredQuestions = Number(lastAttempt.respostas_count ?? 0);

  let status: "pending" | "in-progress" | "completed";

  /**
   * Se o backend finalizou, é concluída, mesmo que o aluno tenha deixado
   * questões em branco.
   */
  if (
    lastAttempt.status === "terminado" ||
    lastAttempt.status === "finalizado"
  ) {
    status = "completed";
  } else if (answeredQuestions > 0 || lastAttempt.status === "iniciado") {
    status = "in-progress";
  } else {
    status = "pending";
  }

  const progress =
    totalQuestions > 0
      ? Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100))
      : 0;

  return {
    status,
    responses: answeredQuestions,
    progress: status === "completed" ? 100 : progress,
    lastAttempt,
  };
}

function getStatusMeta(status: "pending" | "in-progress" | "completed") {
  if (status === "completed") {
    return {
      label: "Finalizada",
      icon: CheckCircle2,
      className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
      barClassName: "bg-emerald-500",
    };
  }

  if (status === "in-progress") {
    return {
      label: "Em progresso",
      icon: PlayCircle,
      className: "border-blue-500/25 bg-blue-500/10 text-blue-400",
      barClassName: "bg-blue-500",
    };
  }

  return {
    label: "Pendente",
    icon: Clock,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    barClassName: "bg-amber-500",
  };
}

export default function MinhasListasPage() {
  const { data: session, status } = useSession();

  const token = useMemo(() => {
    return (session as any)?.laravelToken as string | undefined;
  }, [session]);

  const [isLoading, setIsLoading] = useState(true);
  const [allListas, setAllListas] = useState<Lista[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle("Minhas Listas");

  useEffect(() => {
    async function getDados() {
      if (status === "loading") return;

      if (!token) {
        setError("Você precisa estar logado para ver suas listas.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get("/minhas-listas", {
          headers: authHeaders(token),
        });

        setAllListas(normalizeListas(response.data));
      } catch (err) {
        console.error("Erro ao carregar minhas listas:", err);
        setError("Falha ao carregar suas listas.");
        setAllListas([]);
      } finally {
        setIsLoading(false);
      }
    }

    getDados();
  }, [token, status]);

  const filteredListas = allListas.filter((lista) => {
    const term = searchTerm.toLowerCase().trim();
    const tags = getListaTags(lista);

    const matchesSearch =
      !term ||
      getListaName(lista).toLowerCase().includes(term) ||
      lista.descricao?.toLowerCase().includes(term) ||
      tags.some((tag) => tag.toLowerCase().includes(term));

    const progress = getUserProgress(lista);

    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "pending") {
      return matchesSearch && progress.status === "pending";
    }
    if (activeFilter === "in-progress") {
      return matchesSearch && progress.status === "in-progress";
    }
    if (activeFilter === "completed") {
      return matchesSearch && progress.status === "completed";
    }

    return matchesSearch;
  });

  if (isLoading || status === "loading") {
    return <ConteudoSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#00091A] p-8">
        <div className="text-center text-white">
          <div className="mb-4 text-xl">{error}</div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#0E00D0] px-6 py-2 transition-colors hover:bg-[#1A0DFF]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ExercisesHeader />

      <main className="min-h-screen bg-[#00091A] p-4 font-sans text-white sm:p-8 md:p-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />

              <input
                type="text"
                placeholder="Buscar listas..."
                className="w-full rounded-lg border border-gray-700 bg-[#1e293b] py-3 pl-12 pr-4 text-white placeholder-gray-400 transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-[#E60076]"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {[
                { key: "all" as const, label: "Todas" },
                { key: "pending" as const, label: "Pendentes" },
                { key: "in-progress" as const, label: "Em progresso" },
                { key: "completed" as const, label: "Finalizadas" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`whitespace-nowrap rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    activeFilter === filter.key
                      ? "bg-[#E60076] text-white"
                      : "bg-[#1e293b] text-gray-400 hover:bg-[#334155] hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredListas.length === 0 && searchTerm && (
            <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 text-gray-400">
              Nenhuma lista foi encontrada para a pesquisa realizada.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Link href="/exercicios/minhas-listas/criar">
              <motion.article
                className="group relative min-h-[270px] cursor-pointer overflow-hidden rounded-[1.35rem] border border-slate-700/80 bg-[#1A2233] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#0E00D0]/70 hover:bg-[#20293d]"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_65%)]" />

                <div className="relative flex h-full min-h-[230px] flex-col">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#2A3448] transition group-hover:bg-[#313d55]">
                      <Plus
                        className="h-16 w-16 text-[#4B5875] transition group-hover:text-[#5c6d93]"
                        strokeWidth={2.4}
                      />
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <h3 className="text-[1.15rem] font-medium text-white">
                      Criar Lista
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Monte uma nova lista personalizada
                    </p>
                  </div>
                </div>
              </motion.article>
            </Link>

            {filteredListas.map((lista, index) => {
              const progress = getUserProgress(lista);
              const statusMeta = getStatusMeta(progress.status);
              const StatusIcon = statusMeta.icon;
              const totalQuestoes = getTotalQuestoes(lista);
              const tags = getListaTags(lista);

              return (
                <Link
                  key={lista.id}
                  href={`/exercicios/minhas-listas/${lista.id}`}
                >
                  <motion.article
                    className="group relative min-h-[270px] cursor-pointer overflow-hidden rounded-[1.35rem] border border-slate-800 bg-[#111827] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#0E00D0]/80 hover:bg-[#141f31]"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index + 1}
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#0E00D0]" />

                    <div className="mb-5 flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-[#0E00D0]/30 bg-[#0E00D0]/10 px-3 text-sm font-semibold text-[#0E00D0]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusMeta.label}
                      </div>
                    </div>

                    <h3 className="mb-2 line-clamp-2 text-xl font-bold leading-tight text-white">
                      {getListaName(lista)}
                    </h3>

                    <p className="mb-3 line-clamp-2 min-h-[40px] text-sm leading-relaxed text-slate-400">
                      {lista.descricao || "Lista personalizada de estudos."}
                    </p>

                    <div className="mb-4 text-xs text-slate-500">
                      Criada em {lista.data_criacao ?? "data não informada"}
                    </div>

                    {tags.length > 0 && (
                      <div className="mb-5 flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={`${lista.id}-${tag}-${tagIndex}`}
                            className="max-w-[130px] truncate rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300"
                            title={tag}
                          >
                            {tag}
                          </span>
                        ))}

                        {tags.length > 3 && (
                          <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-400">
                            +{tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-950/55 p-3">
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-slate-400">Questões</span>
                        <span className="font-medium text-slate-300">
                          {totalQuestoes}
                        </span>
                      </div>

                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-slate-400">Tempo</span>
                        <span className="font-medium text-slate-300">
                          {formatTime(getListaTimeMinutes(lista))}
                        </span>
                      </div>

                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {progress.responses}/{totalQuestoes} respondidas
                        </span>
                        <span>{progress.progress}%</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className={`h-full rounded-full ${statusMeta.barClassName}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.progress}%` }}
                          transition={{
                            duration: 0.9,
                            delay: 0.08 * index,
                          }}
                        />
                      </div>
                    </div>

                    <div className="pointer-events-none absolute bottom-4 right-4 opacity-0 transition group-hover:opacity-100">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E00D0] shadow-lg shadow-[#0E00D0]/25">
                        <PencilLine className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </motion.article>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

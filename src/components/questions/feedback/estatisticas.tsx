// components/questions/feedback/estatisticas.tsx
"use client";

import { motion } from "framer-motion";
import { AlertCircle, BarChart3, Loader2, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getQuestaoStats,
  type QuestaoStats,
} from "@/lib/questions/estatisticas";

interface EstatisticasQuestaoProps {
  questaoId: number;
  dificuldade?: number;
  token?: string;
}

function clampPercent(value: unknown) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(100, parsed));
}

function formatPercent(value: unknown) {
  return `${clampPercent(value).toFixed(0)}%`;
}

function getDificuldadeTexto(nivel?: number) {
  switch (Number(nivel)) {
    case 1:
      return "Muito fácil";
    case 2:
      return "Fácil";
    case 3:
      return "Média";
    case 4:
      return "Difícil";
    case 5:
      return "Muito difícil";
    default:
      return "Não avaliada";
  }
}

function getFaixaDesempenho(taxa: number) {
  if (taxa >= 70) {
    return "Desempenho alto";
  }

  if (taxa < 40) {
    return "Desempenho baixo";
  }

  return "Desempenho intermediário";
}

function EstatisticasShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="my-6 flex justify-center"
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-800 bg-[#0e1525] shadow-2xl">
        {children}
      </div>
    </motion.div>
  );
}

export const EstatisticasQuestao: React.FC<EstatisticasQuestaoProps> = ({
  questaoId,
  dificuldade,
  token,
}) => {
  const [estatisticas, setEstatisticas] = useState<QuestaoStats | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questaoId || !token) {
      setLoading(false);
      return;
    }

    let cancelado = false;

    async function carregarEstatisticas() {
      try {
        setLoading(true);
        setError(null);
        if (!token) return;

        const safeToken = token;
        const data = await getQuestaoStats(safeToken, questaoId);

        if (!cancelado) {
          setEstatisticas(data);
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar as estatísticas.",
          );
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregarEstatisticas();

    return () => {
      cancelado = true;
    };
  }, [questaoId, token]);

  const alternativas = useMemo(() => {
    const lista =
      estatisticas?.alternativas_stats ?? estatisticas?.alternativas ?? [];

    return [...lista].sort((a, b) => {
      const letraA = String(a.letra ?? "");
      const letraB = String(b.letra ?? "");

      return letraA.localeCompare(letraB);
    });
  }, [estatisticas]);

  const taxaAcerto = clampPercent(
    estatisticas?.taxa_acerto ?? estatisticas?.accuracy_rate,
  );

  if (loading) {
    return (
      <EstatisticasShell>
        <div className="flex items-center justify-center gap-3 px-6 py-8 text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <span className="text-sm font-medium">
            Carregando estatísticas...
          </span>
        </div>
      </EstatisticasShell>
    );
  }

  if (error) {
    return (
      <EstatisticasShell>
        <div className="flex items-start gap-3 px-6 py-6 text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <h3 className="text-sm font-semibold">
              Erro ao carregar estatísticas
            </h3>

            <p className="mt-1 text-sm text-red-200/80">{error}</p>
          </div>
        </div>
      </EstatisticasShell>
    );
  }

  if (!estatisticas) {
    return (
      <EstatisticasShell>
        <div className="flex items-center justify-center gap-3 px-6 py-8 text-gray-400">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium">
            Nenhuma estatística disponível para esta questão.
          </span>
        </div>
      </EstatisticasShell>
    );
  }

  return (
    <EstatisticasShell>
      <div className="border-b border-gray-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-950/30">
            <BarChart3 className="h-5 w-5 text-blue-300" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Estatísticas da questão
            </h3>

            <p className="mt-0.5 text-sm text-gray-400">
              Distribuição percentual das respostas.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <div className="rounded-xl border border-gray-800 bg-[#131b2d] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Target className="h-4 w-4 text-blue-300" />
                Taxa de acerto
              </div>

              <span className="text-sm text-gray-400">
                {getFaixaDesempenho(taxaAcerto)}
              </span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <span className="text-3xl font-bold text-white">
                {formatPercent(taxaAcerto)}
              </span>

              <span className="rounded-full border border-gray-700 bg-[#0e1525] px-3 py-1 text-xs font-medium text-gray-300">
                {getDificuldadeTexto(dificuldade)}
              </span>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-700"
                style={{ width: `${taxaAcerto}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-[#131b2d] p-4">
            <p className="text-sm font-medium text-gray-300">Leitura</p>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              {taxaAcerto >= 70
                ? "A questão apresenta uma taxa de acerto elevada."
                : taxaAcerto < 40
                  ? "A questão apresenta uma taxa de acerto mais baixa."
                  : "A questão apresenta uma distribuição equilibrada."}
            </p>
          </div>
        </div>

        {alternativas.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-white">
                Distribuição por alternativa
              </h4>

              <span className="text-xs text-gray-500">porcentagens</span>
            </div>

            <div className="space-y-2.5">
              {alternativas.map((alternativa) => {
                const porcentagem = clampPercent(alternativa.porcentagem);
                const letra = String(alternativa.letra ?? "").toUpperCase();

                return (
                  <div
                    key={alternativa.id}
                    className="rounded-xl border border-gray-800 bg-[#131b2d] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          alternativa.is_correta
                            ? "border border-green-500/30 bg-green-500/15 text-green-300"
                            : "border border-gray-700 bg-[#0e1525] text-gray-300",
                        ].join(" ")}
                      >
                        {letra}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="truncate text-sm text-gray-300">
                            {alternativa.is_correta
                              ? "Alternativa correta"
                              : "Alternativa"}
                          </span>

                          <span className="shrink-0 text-sm font-semibold text-white">
                            {formatPercent(porcentagem)}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                          <div
                            className={[
                              "h-full rounded-full transition-all duration-700",
                              alternativa.is_correta
                                ? "bg-green-400"
                                : "bg-blue-400/70",
                            ].join(" ")}
                            style={{ width: `${Math.max(2, porcentagem)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </EstatisticasShell>
  );
};

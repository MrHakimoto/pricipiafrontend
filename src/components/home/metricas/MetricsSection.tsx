// components/home/metricas/MetricsSection.tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Folders,
  LayoutList,
  SquareCheckBig,
  SquareX,
  Target,
  type LucideIcon,
} from "lucide-react";
import type {
  AssuntoStats,
  EvolucaoSemanal,
  QuestoesStats,
} from "@/lib/dashboard/homeStats";

interface MetricsSectionProps {
  dados: QuestoesStats;
}

type TabType = "assuntos" | "topicos" | "semana";

type SemanaRender = EvolucaoSemanal & {
  inicio: Date;
  fim: Date;
  isReal: boolean;
};

const RADIUS = 28.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_SEMANAS_RENDERIZADAS = 80;

function formatarData(data: Date): string {
  return `${String(data.getDate()).padStart(2, "0")}/${String(
    data.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function normalizarPeriodo(periodo: string): string {
  return periodo
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, " - ");
}

function getInicioSemanaDomingo(data: Date): Date {
  const novaData = new Date(data);
  const diaSemana = novaData.getDay();

  novaData.setDate(novaData.getDate() - diaSemana);
  novaData.setHours(0, 0, 0, 0);

  return novaData;
}

function parseDiaMes(dataStr: string, ano: number): Date {
  const [dia, mes] = dataStr.split("/").map(Number);
  return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
}

function inferirAnoInicialPeloMes(mes: number, referencia: Date): number {
  const mesReferencia = referencia.getMonth() + 1;

  // Se estamos, por exemplo, em junho/2026 e aparece dezembro,
  // muito provavelmente é dezembro/2025.
  if (mes > mesReferencia + 1) {
    return referencia.getFullYear() - 1;
  }

  return referencia.getFullYear();
}

function parsePeriodo(periodo: string, referencia = new Date()) {
  const periodoNormalizado = normalizarPeriodo(periodo);
  const [inicioStr, fimStr] = periodoNormalizado.split(" - ");

  if (!inicioStr || !fimStr) {
    return null;
  }

  const [, mesInicio] = inicioStr.split("/").map(Number);
  const [, mesFim] = fimStr.split("/").map(Number);

  let anoInicio = inferirAnoInicialPeloMes(mesInicio, referencia);
  let anoFim = anoInicio;

  if (mesFim < mesInicio) {
    anoFim += 1;
  }

  const inicio = parseDiaMes(inicioStr, anoInicio);
  const fim = parseDiaMes(fimStr, anoFim);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return null;
  }

  return {
    periodo: `${formatarData(inicio)} - ${formatarData(fim)}`,
    inicio,
    fim,
  };
}

function getDiaSemana(data: Date): string {
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  return dias[data.getDay()];
}

function plural(value: number, singular: string, pluralText: string) {
  return value === 1 ? singular : pluralText;
}

function getPercent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function getDashoffset(part: number, total: number) {
  if (!total) return CIRCUMFERENCE;
  return CIRCUMFERENCE - (part / total) * CIRCUMFERENCE;
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, value));
}

function gerarCorAssunto(index: number) {
  const g1 = clampColor(100 + index * 20);
  const b1 = clampColor(50 + index * 10);

  const g2 = clampColor(150 + index * 10);
  const b2 = clampColor(100 + index * 5);

  const g3 = clampColor(50 + index * 10);
  const b3 = clampColor(20 + index * 5);

  return {
    borderColor: `rgb(255, ${g1}, ${b1})`,
    background: `radial-gradient(circle, rgba(255, ${g2}, ${b2}, 0.3) 0%, rgba(255, ${g1}, ${b1}, 1) 50%, rgba(255, ${g3}, ${b3}, 0.8) 100%)`,
  };
}

function MiniSplitBar({
  acertos,
  erros,
  total,
  empty = false,
}: {
  acertos: number;
  erros: number;
  total: number;
  empty?: boolean;
}) {
  const percentAcertos = total > 0 ? (acertos / total) * 100 : 0;
  const percentErros = total > 0 ? (erros / total) * 100 : 0;

  return (
    <div className="relative mt-1 flex h-[5px] w-[90px] flex-row justify-between overflow-hidden rounded-[1.5px] bg-gray-200 dark:bg-gray-700">
      {empty ? (
        <div
          className="ml-auto h-full rounded-[1.5px] bg-gray-300 transition-[width] dark:bg-gray-600"
          style={{ width: "100%" }}
        />
      ) : (
        <>
          <div
            className="ml-auto h-full rounded-[1.5px] bg-green-500 transition-[width]"
            style={{ width: `${percentAcertos}%` }}
          />
          <div className="min-w-[3px] flex-1" />
          <div
            className="ml-auto h-full rounded-[1.5px] bg-red-500 transition-[width]"
            style={{ width: `${percentErros}%` }}
          />
        </>
      )}
    </div>
  );
}

function EmptyContent({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

function gerarSemanasFallback(): SemanaRender[] {
  const hoje = new Date();
  const inicioSemanaAtual = getInicioSemanaDomingo(hoje);
  const semanas: SemanaRender[] = [];

  for (let i = 15; i >= 1; i--) {
    const inicio = new Date(inicioSemanaAtual);
    inicio.setDate(inicioSemanaAtual.getDate() - i * 7);

    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);

    semanas.push({
      periodo: `${formatarData(inicio)} - ${formatarData(fim)}`,
      inicio,
      fim,
      total: 0,
      acertos: 0,
      erros: 0,
      isReal: false,
    });
  }

  const fimAtual = new Date(inicioSemanaAtual);
  fimAtual.setDate(inicioSemanaAtual.getDate() + 6);

  semanas.push({
    periodo: `${formatarData(inicioSemanaAtual)} - ${formatarData(fimAtual)}`,
    inicio: inicioSemanaAtual,
    fim: fimAtual,
    total: 0,
    acertos: 0,
    erros: 0,
    isReal: false,
  });

  for (let i = 1; i <= 2; i++) {
    const inicio = new Date(inicioSemanaAtual);
    inicio.setDate(inicioSemanaAtual.getDate() + i * 7);

    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);

    semanas.push({
      periodo: `${formatarData(inicio)} - ${formatarData(fim)}`,
      inicio,
      fim,
      total: 0,
      acertos: 0,
      erros: 0,
      isReal: false,
    });
  }

  return semanas;
}

export default function MetricsSection({ dados }: MetricsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("semana");

  const semanas = useMemo(() => {
    const referencia = new Date();
    const dadosValidos = (dados.evolucao_semanal ?? [])
      .map((item) => {
        const periodoParseado = parsePeriodo(item.periodo, referencia);

        if (!periodoParseado) {
          return null;
        }

        return {
          ...item,
          periodo: periodoParseado.periodo,
          inicio: periodoParseado.inicio,
          fim: periodoParseado.fim,
          total: Number(item.total ?? 0),
          acertos: Number(item.acertos ?? 0),
          erros: Number(item.erros ?? 0),
          isReal: true,
        } satisfies SemanaRender;
      })
      .filter(Boolean) as SemanaRender[];

    if (dadosValidos.length === 0) {
      return gerarSemanasFallback();
    }

    const dadosPorPeriodo = new Map(
      dadosValidos.map((item) => [normalizarPeriodo(item.periodo), item]),
    );

    const semanasOrdenadas = [...dadosValidos].sort(
      (a, b) => a.inicio.getTime() - b.inicio.getTime(),
    );

    const primeiraSemanaReal = semanasOrdenadas[0];
    const inicioSemanaAtual = getInicioSemanaDomingo(referencia);

    let inicioRange = getInicioSemanaDomingo(primeiraSemanaReal.inicio);

    const fimRange = new Date(inicioSemanaAtual);
    fimRange.setDate(inicioSemanaAtual.getDate() + 14);

    const semanasGeradas: SemanaRender[] = [];
    const cursor = new Date(inicioRange);

    while (
      cursor <= fimRange &&
      semanasGeradas.length < MAX_SEMANAS_RENDERIZADAS
    ) {
      const inicio = new Date(cursor);
      const fim = new Date(inicio);
      fim.setDate(inicio.getDate() + 6);

      const periodo = `${formatarData(inicio)} - ${formatarData(fim)}`;
      const dadoReal = dadosPorPeriodo.get(normalizarPeriodo(periodo));

      semanasGeradas.push(
        dadoReal
          ? {
              ...dadoReal,
              inicio,
              fim,
              periodo,
              isReal: true,
            }
          : {
              periodo,
              inicio,
              fim,
              total: 0,
              acertos: 0,
              erros: 0,
              isReal: false,
            },
      );

      cursor.setDate(cursor.getDate() + 7);
    }

    return semanasGeradas;
  }, [dados.evolucao_semanal]);

  const tabs = [
    { id: "assuntos" as TabType, label: "Por Assunto", icon: LayoutList },
    { id: "topicos" as TabType, label: "Por Tópicos", icon: Folders },
    { id: "semana" as TabType, label: "Por Semana", icon: Calendar },
  ];

  const { total, acertos, erros } = dados.geral;

  const taxaAcerto = getPercent(acertos, total);
  const taxaErro = getPercent(erros, total);

  const acertosDashoffset = getDashoffset(acertos, total);
  const errosDashoffset = getDashoffset(erros, total);
  const rotationErros = total > 0 ? (acertos / total) * 360 : 0;

  const indiceSemanaAtual = useMemo(() => {
    const inicioAtual = getInicioSemanaDomingo(new Date());

    const fimAtual = new Date(inicioAtual);
    fimAtual.setDate(inicioAtual.getDate() + 6);

    const periodoAtual = normalizarPeriodo(
      `${formatarData(inicioAtual)} - ${formatarData(fimAtual)}`,
    );

    return semanas.findIndex(
      (semana) => normalizarPeriodo(semana.periodo) === periodoAtual,
    );
  }, [semanas]);

  const renderConteudoAssuntos = () => {
    if (!dados.por_assunto || dados.por_assunto.length === 0) {
      return (
        <EmptyContent
          icon={LayoutList}
          title="Nenhum dado por assunto disponível"
          subtitle="Complete listas para ver estatísticas"
        />
      );
    }

    return (
      <div className="space-y-0">
        {dados.por_assunto.map((assunto: AssuntoStats, index: number) => {
          const totalAssunto = assunto.total || assunto.acertos + assunto.erros;
          const percentAcertos =
            totalAssunto > 0 ? (assunto.acertos / totalAssunto) * 100 : 0;
          const percentErros =
            totalAssunto > 0 ? (assunto.erros / totalAssunto) * 100 : 0;

          return (
            <div
              key={`${assunto.assunto}-${index}`}
              className="flex min-h-[48px] flex-row justify-between gap-4 border-t border-gray-200 py-2.5 first:border-t-0 dark:border-gray-700"
            >
              <div className="flex min-w-0 flex-row items-center gap-2.5">
                <div
                  className="h-5 w-5 shrink-0 rounded-[30%] border dark:border-gray-600"
                  style={gerarCorAssunto(index)}
                />

                <div className="truncate text-sm align-middle text-gray-900 dark:text-gray-200">
                  {assunto.assunto}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {totalAssunto} {plural(totalAssunto, "Resposta", "Respostas")}
                </span>

                <div className="relative mt-1 flex h-[5px] w-[90px] flex-row justify-between overflow-hidden rounded-[1.5px] bg-gray-200 dark:bg-gray-700">
                  <div
                    className="ml-auto h-full rounded-[1.5px] bg-green-500 transition-[width]"
                    style={{ width: `${percentAcertos}%` }}
                  />
                  <div className="min-w-[3px] flex-1" />
                  <div
                    className="ml-auto h-full rounded-[1.5px] bg-red-500 transition-[width]"
                    style={{ width: `${percentErros}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderConteudoTopicos = () => {
    if (
      !dados.topicos_mais_errados ||
      dados.topicos_mais_errados.length === 0
    ) {
      return (
        <EmptyContent
          icon={Folders}
          title="Nenhum tópico com dados disponível"
          subtitle="Continue praticando para ver estatísticas"
        />
      );
    }

    return (
      <div className="space-y-0">
        {dados.topicos_mais_errados.map((topico, index) => (
          <div
            key={`${topico.topico}-${index}`}
            className="flex min-h-[48px] flex-row justify-between gap-4 border-t border-gray-200 py-2.5 first:border-t-0 dark:border-gray-700"
          >
            <div className="flex min-w-0 flex-row items-center gap-2.5">
              <div
                className="h-5 w-5 shrink-0 rounded-[30%] border dark:border-gray-600"
                style={{
                  borderColor: "#C6005C",
                  background:
                    "radial-gradient(circle, rgba(198, 0, 92, 0.3) 0%, rgba(198, 0, 92, 1) 50%, rgba(198, 0, 92, 0.8) 100%)",
                }}
              />

              <div className="truncate text-sm align-middle text-gray-900 dark:text-gray-200">
                {topico.topico}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {topico.erros} {plural(topico.erros, "Erro", "Erros")}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderConteudoSemana = () => {
    return (
      <div className="space-y-0">
        {semanas.map((semana, index) => {
          const [dataInicioStr, dataFimStr] = semana.periodo.split(" - ");
          const temDados = semana.total > 0;
          const isCurrentWeek = index === indiceSemanaAtual;
          const taxaSemana = getPercent(semana.acertos, semana.total);

          return (
            <div
              key={`${semana.periodo}-${index}`}
              className={`
                flex min-h-[48px] flex-row justify-between gap-4 border-t border-gray-200 px-1 py-1.5 first:border-t-0 dark:border-gray-700
                ${!temDados ? "opacity-50" : ""}
                ${isCurrentWeek ? "bg-blue-50 dark:bg-blue-900/10" : ""}
              `}
            >
              <div className="flex min-w-0 flex-row items-center gap-2.5 text-[13px] text-gray-900 dark:text-gray-200">
                <div className="flex flex-col leading-none">
                  <span className="font-mono">{dataInicioStr}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getDiaSemana(semana.inicio)}
                  </span>
                </div>

                <ArrowRight className="size-4 shrink-0 text-gray-500 dark:text-gray-400" />

                <div className="flex flex-col leading-none">
                  <span className="font-mono">{dataFimStr}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getDiaSemana(semana.fim)}
                  </span>
                </div>

                {isCurrentWeek && (
                  <span className="ml-1 hidden rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 sm:inline-flex">
                    atual
                  </span>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end">
                <span
                  className={`text-sm font-semibold text-gray-600 dark:text-gray-400 ${
                    !temDados ? "opacity-50" : ""
                  }`}
                >
                  {temDados
                    ? `${semana.total} ${plural(
                        semana.total,
                        "Resposta",
                        "Respostas",
                      )}`
                    : "0 Respostas"}
                </span>

                <div className="flex items-center gap-2">
                  {temDados && (
                    <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      {taxaSemana}%
                    </span>
                  )}

                  <MiniSplitBar
                    acertos={semana.acertos}
                    erros={semana.erros}
                    total={semana.total}
                    empty={!temDados}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-auto flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6 lg:h-[500px]">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl bg-green-500 p-2">
            <Target className="h-4 w-4 text-white" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
              Métricas de Performance
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Seu desempenho geral
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-row items-center gap-4">
          <div className="relative flex shrink-0 items-center justify-center">
            <svg className="h-[65px] w-[65px]">
              <circle
                cy="32.5"
                cx="32.5"
                strokeWidth="8"
                fill="transparent"
                r={RADIUS}
                className="stroke-gray-100 dark:stroke-gray-800"
              />

              {total > 0 && (
                <>
                  <circle
                    cy="32.5"
                    cx="32.5"
                    strokeWidth="8"
                    fill="transparent"
                    r={RADIUS}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={acertosDashoffset}
                    className="stroke-green-500"
                    strokeLinecap="round"
                    transform="rotate(0, 32.5, 32.5)"
                  />

                  <circle
                    cy="32.5"
                    cx="32.5"
                    strokeWidth="8"
                    fill="transparent"
                    r={RADIUS}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={errosDashoffset}
                    className="stroke-red-500"
                    strokeLinecap="round"
                    transform={`rotate(${rotationErros}, 32.5, 32.5)`}
                  />
                </>
              )}
            </svg>
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="mb-1 text-lg font-bold leading-none text-gray-900 dark:text-white">
              {total} {plural(total, "resposta", "respostas")}
            </span>

            <span className="flex items-center gap-1 text-xs font-medium leading-none text-green-500 font-mono">
              <SquareCheckBig className="size-3.5" />
              <span>{taxaAcerto}%</span>
            </span>

            <span className="flex items-center gap-1 text-xs font-medium leading-none text-red-500 font-mono">
              <SquareX className="size-3.5" />
              <span>{taxaErro}%</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                isActive
                  ? "text-[#C6005C] dark:text-[#C6005C]"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C6005C] dark:bg-[#C6005C]"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-[250px] flex-1 overflow-y-auto pr-1">
        {activeTab === "assuntos" && renderConteudoAssuntos()}
        {activeTab === "topicos" && renderConteudoTopicos()}
        {activeTab === "semana" && renderConteudoSemana()}
      </div>
    </div>
  );
}
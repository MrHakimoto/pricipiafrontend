// components/home/metricas/MyLists.tsx
"use client";

import {
  CheckCircle,
  ClipboardList,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ListaDetalhe, ListasStats } from "@/lib/dashboard/homeStats";

interface MyListsProps {
  dados: ListasStats;
}

type GrupoLista = {
  titulo: string;
  badge: string;
  badgeClassName: string;
  dotClassName: string;
  detalhes: ListaDetalhe[];
  concluidas: number;
  acertos: number;
  erros: number;
  tipo: "lista" | "simulado";
};

const RADIUS = 28.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

function StatLine({
  icon: Icon,
  value,
  className,
}: {
  icon: LucideIcon;
  value: string;
  className: string;
}) {
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium leading-none font-mono ${className}`}
    >
      <Icon className="size-3.5" />
      <span>{value}</span>
    </span>
  );
}

function DonutChart({
  acertos,
  erros,
  total,
}: {
  acertos: number;
  erros: number;
  total: number;
}) {
  const acertosDashoffset = getDashoffset(acertos, total);
  const errosDashoffset = getDashoffset(erros, total);
  const rotationErros = total > 0 ? (acertos / total) * 360 : 0;

  return (
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
  );
}

function GrupoResumo({ grupo }: { grupo: GrupoLista }) {
  const total = grupo.acertos + grupo.erros;
  const taxaAcerto = getPercent(grupo.acertos, total);
  const taxaErro = getPercent(grupo.erros, total);

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {grupo.titulo}
        </h3>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${grupo.badgeClassName}`}
        >
          {grupo.concluidas} {grupo.badge}
          {grupo.concluidas !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-row items-center gap-4">
        <DonutChart acertos={grupo.acertos} erros={grupo.erros} total={total} />

        <div className="flex min-w-0 flex-col gap-1">
          <span className="mb-1 text-lg font-bold leading-none text-gray-900 dark:text-white">
            {total} {plural(total, "resposta", "respostas")}
          </span>

          <StatLine
            icon={CheckCircle}
            value={`${taxaAcerto}%`}
            className="text-green-500"
          />

          <StatLine
            icon={XCircle}
            value={`${taxaErro}%`}
            className="text-red-500"
          />
        </div>
      </div>
    </div>
  );
}

function LinhaDetalhe({
  item,
  tipo,
}: {
  item: ListaDetalhe;
  tipo: "lista" | "simulado";
}) {
  const percentAcertos = item.total > 0 ? (item.acertos / item.total) * 100 : 0;
  const percentErros = item.total > 0 ? (item.erros / item.total) * 100 : 0;
  const taxa = getPercent(item.acertos, item.total);

  return (
    <div className="flex min-h-[48px] flex-row justify-between gap-4 border-t border-gray-200 py-2.5 first:border-t-0 dark:border-gray-700">
      <div className="flex min-w-0 flex-row items-center gap-2.5">
        <div
          className={`h-5 w-5 shrink-0 rounded-[30%] border dark:border-gray-600 ${
            tipo === "lista"
              ? "bg-gradient-to-br from-blue-400 to-blue-600"
              : "bg-gradient-to-br from-green-400 to-green-600"
          }`}
        />

        <div className="min-w-0">
          <div className="truncate text-sm align-middle text-gray-900 dark:text-gray-200">
            {item.nome}
          </div>

          {item.data_conclusao && (
            <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {item.data_conclusao}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          {item.total} {plural(item.total, "Questão", "Questões")}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
            {taxa}%
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
    </div>
  );
}

export default function MyLists({ dados }: MyListsProps) {
  const { listas_praticas, simulados_provas } = dados;

  const totalAcertosListas =
    listas_praticas.acertos ??
    listas_praticas.detalhes.reduce((acc, lista) => acc + lista.acertos, 0);

  const totalErrosListas =
    listas_praticas.erros ??
    listas_praticas.detalhes.reduce((acc, lista) => acc + lista.erros, 0);

  const totalAcertosSimulados =
    simulados_provas.acertos ??
    simulados_provas.detalhes.reduce(
      (acc, simulado) => acc + simulado.acertos,
      0,
    );

  const totalErrosSimulados =
    simulados_provas.erros ??
    simulados_provas.detalhes.reduce(
      (acc, simulado) => acc + simulado.erros,
      0,
    );

  const grupos: GrupoLista[] = [
    {
      titulo: "Listas Práticas",
      badge: "concluída",
      badgeClassName:
        "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300",
      dotClassName: "bg-gradient-to-br from-blue-400 to-blue-600",
      detalhes: listas_praticas.detalhes,
      concluidas: listas_praticas.concluidas,
      acertos: totalAcertosListas,
      erros: totalErrosListas,
      tipo: "lista",
    },
    {
      titulo: "Simulados",
      badge: "concluído",
      badgeClassName:
        "bg-green-100 text-green-600 dark:bg-green-900/60 dark:text-green-300",
      dotClassName: "bg-gradient-to-br from-green-400 to-green-600",
      detalhes: simulados_provas.detalhes,
      concluidas: simulados_provas.concluidas,
      acertos: totalAcertosSimulados,
      erros: totalErrosSimulados,
      tipo: "simulado",
    },
  ];

  const semDetalhes =
    listas_praticas.detalhes.length === 0 &&
    simulados_provas.detalhes.length === 0;

  return (
    <div className="flex h-auto flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6 lg:h-[500px]">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl bg-blue-500 p-2">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
              Minhas Listas
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Desempenho por tipo de lista
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {grupos.map((grupo) => (
            <GrupoResumo key={grupo.titulo} grupo={grupo} />
          ))}
        </div>
      </div>

      <div className="min-h-[220px] flex-1 overflow-y-auto pr-1">
        {semDetalhes ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <ClipboardList className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma lista concluída
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Complete listas para ver estatísticas
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {grupos.map((grupo) =>
              grupo.detalhes.map((item, index) => (
                <LinhaDetalhe
                  key={`${grupo.tipo}-${item.id}-${item.data_conclusao}-${index}`}
                  item={item}
                  tipo={grupo.tipo}
                />
              )),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
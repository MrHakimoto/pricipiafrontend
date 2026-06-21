// components/questions/ModelQuestionsWithNavigation.tsx
"use client";

import { NavigationProvider } from "@/contexts/NavigationContext";
import { QuestionNavigationSidebar } from "@/components/questions/QuestionNavigationSidebar";
import { QuestionProgress } from "@/components/questions/QuestionProgress";
import { ModelQuestions } from "@/components/questions/ModelQuestions";
import type { Questao } from "@/types/list";

interface ModelQuestionsWithNavigationProps {
  questions: Questao[];
  showSidebar?: boolean;
  showProgress?: boolean;
}

type QuestaoTipo =
  | "objetiva"
  | "discursiva"
  | "resposta_numerica"
  | "certo_errado";

function normalizarTipoQuestao(tipo?: string | null): QuestaoTipo {
  const normalized = String(tipo ?? "")
    .toLowerCase()
    .trim()
    .replace("-", "_");

  if (normalized === "discursiva") return "discursiva";

  if (
    normalized === "resposta_numerica" ||
    normalized === "resposta_numérica" ||
    normalized === "numerica" ||
    normalized === "numérica"
  ) {
    return "resposta_numerica";
  }

  if (
    normalized === "certo_errado" ||
    normalized === "certo/errado" ||
    normalized === "verdadeiro_falso" ||
    normalized === "verdadeiro/falso"
  ) {
    return "certo_errado";
  }

  return "objetiva";
}

type GabaritoCertoErradoNormalizado = "certo" | "errado";

function normalizarGabaritoCertoErrado(
  value?: string | boolean | null,
): GabaritoCertoErradoNormalizado | null {
  if (value === true) return "certo";
  if (value === false) return "errado";

  const normalized = String(value ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    normalized === "certo" ||
    normalized === "verdadeiro" ||
    normalized === "true" ||
    normalized === "1"
  ) {
    return "certo";
  }

  if (
    normalized === "errado" ||
    normalized === "falso" ||
    normalized === "false" ||
    normalized === "0"
  ) {
    return "errado";
  }

  return null;
}

export const ModelQuestionsWithNavigation: React.FC<
  ModelQuestionsWithNavigationProps
> = ({ questions, showSidebar = true, showProgress = true }) => {
  const convertedQuestions = questions.map((questao) => ({
    ...questao,
    tipo: normalizarTipoQuestao(questao.tipo),
    alternativa_correta_id: Number(questao.alternativa_correta_id ?? 0),
    gabarito_comentado_texto: questao.gabarito_comentado_texto ?? "",
    gabarito_certo_errado: normalizarGabaritoCertoErrado(
      questao.gabarito_certo_errado,
    ),
    resposta_numerica:
      questao.resposta_numerica === null ||
      questao.resposta_numerica === undefined
        ? null
        : String(questao.resposta_numerica),
    dificuldade: Number(questao.dificuldade ?? 0),
    minutagem:
      questao.minutagem === null || questao.minutagem === undefined
        ? null
        : Number(questao.minutagem),
    adaptado: Boolean(questao.adaptado),
    prova: questao.prova
      ? {
          ...questao.prova,
          banca: {
            nome: questao.prova.banca?.nome || "",
          },
          ano: questao.prova.ano ?? 0,
        }
      : {
          banca: { nome: "" },
          ano: 0,
        },
  }));

  return (
    <NavigationProvider questions={convertedQuestions}>
      <div className="flex h-screen bg-gray-900">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl p-6">
            {showProgress && <QuestionProgress />}
            <ModelQuestions questions={convertedQuestions} />
          </div>
        </div>

        {showSidebar && <QuestionNavigationSidebar />}
      </div>
    </NavigationProvider>
  );
};

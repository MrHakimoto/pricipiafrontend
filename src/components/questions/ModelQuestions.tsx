// components/questions/ModelQuestions.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ChartColumn,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";

import { AnswerFeedbackOverlay } from "@/components/questions/AnswerFeedbackOverlay";

import { GabaritoQuestao } from "./feedback/gabarito";
import { DuvidaQuestao } from "./feedback/duvida";
import { EstatisticasQuestao } from "./feedback/estatisticas";
import ReportarModal from "@/components/questions/ReportModal";
import OpcoesQuestao from "@/components/questions/OpcoesQuestao";
import { responderQuestaoAvulsa } from "@/lib/respostaAvulsa";
import {
  getQuestaoStats,
  type QuestaoStats,
  type QuestaoAlternativeStats,
} from "@/lib/questions/estatisticas";
import { processMarkdown } from "@/utils/markdownProcessor";
import { markdownProcessorAlternativas } from "@/utils/markdownProcessorAlternativas";
import { MultipleQuestionSkeleton } from "../Skeletons/QuestionSkeleton";
import { ImageLightbox } from "@/components/editor/ImageLightbox";

type QuestaoTab = "gabarito" | "duvida" | "estatisticas" | null;

type ServerFeedback = {
  is_correct: boolean;
  gabarito: number;
};

type SimpleAlternativa = {
  id: number;
  letra: string;
  texto: string;
  processedText?: string;
};

type SimpleTopico = {
  id: number;
  nome: string;
};

type ModelQuestao = {
  id: number;
  enunciado: string;
  alternativas: SimpleAlternativa[];
  alternativa_correta_id: number;

  gabarito_video?: string | null;
  gabarito_comentado_texto?: string | null;

  dificuldade?: number | null;
  adaptado?: boolean | number | null;

  topicos?: SimpleTopico[];

  prova?: {
    id?: number;
    nome?: string | null;
    sigla?: string | null;
    ano?: number | string | null;
    banca?: {
      id?: number;
      nome?: string | null;
      sigla?: string | null;
    } | null;
  } | null;
};

type LaravelMeta = {
  current_page?: number;
  from?: number | null;
  to?: number | null;
  total?: number;
  last_page?: number;
  per_page?: number;
};

type ModelQuestionsProps = {
  /**
   * Uso normal no /exercicios/s:
   * <ModelQuestions questions={questions} meta={questionsResponse} />
   */
  questions?: ModelQuestao[];

  /**
   * Uso para questão única:
   * <ModelQuestions question={questao} />
   */
  question?: ModelQuestao | null;

  /**
   * Mantido para compatibilidade com /s/, mesmo que este componente
   * não renderize paginação diretamente.
   */
  meta?: LaravelMeta | null;

  className?: string;

  /**
   * Útil quando a questão aparece fora de uma lista paginada.
   */
  startIndex?: number;

  /**
   * Se true, força a aparência de questão única.
   */
  singleMode?: boolean;

  /**
   * Se false, não exibe mensagem quando não houver questões.
   */
  showEmptyState?: boolean;

  /**
   * Se true, mostra skeleton interno.
   */
  isLoading?: boolean;
};

type QuizOptionProps = {
  alternativa: SimpleAlternativa;
  alternativaCorretaId: number;
  selecaoAtual: number | null;
  statusResposta: "unanswered" | "correct" | "incorrect";
  onSelect: (alternativaId: number) => void;
  serverFeedback?: ServerFeedback;
  stats?: QuestaoAlternativeStats | null;
  showStats?: boolean;
};

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function getTokenFromSession(session: any): string {
  return String(
    session?.laravelToken ||
      session?.accessToken ||
      session?.user?.laravelToken ||
      "",
  )
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function extractCorrectAlternativeId(value: any, fallbackCorrectAlternativeId: number) {
  const rawGabarito =
    typeof value?.gabarito === "object"
      ? value?.gabarito?.alternativa_correta_id
      : value?.gabarito;

  return Number(
    rawGabarito ??
      value?.alternativa_correta_id ??
      value?.correct_alternative_id ??
      fallbackCorrectAlternativeId,
  );
}

function normalizeFeedback(
  value: any,
  fallbackCorrectAlternativeId: number,
): ServerFeedback {
  return {
    is_correct: Boolean(value?.is_correct ?? value?.foi_correta),
    gabarito: extractCorrectAlternativeId(value, fallbackCorrectAlternativeId),
  };
}

function getDifficultyBadge(dificuldade?: number | null) {
  switch (Number(dificuldade)) {
    case 1:
      return (
        <div className="rounded-lg border-2 border-green-400 bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          Muito Fácil
        </div>
      );
    case 2:
      return (
        <div className="rounded-lg border-2 border-lime-400 bg-lime-100 px-3 py-1 text-sm font-semibold text-lime-800">
          Fácil
        </div>
      );
    case 3:
      return (
        <div className="rounded-lg border-2 border-yellow-400 bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
          Médio
        </div>
      );
    case 4:
      return (
        <div className="rounded-lg border-2 border-orange-500 bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
          Difícil
        </div>
      );
    case 5:
      return (
        <div className="rounded-lg border-2 border-red-500 bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
          Muito Difícil
        </div>
      );
    default:
      return null;
  }
}

const AlternativeStatsMini = ({
  stats,
}: {
  stats?: QuestaoAlternativeStats | null;
}) => {
  if (!stats) return null;

  const porcentagem = Math.max(
    0,
    Math.min(100, Number(stats.porcentagem || 0)),
  );

  const size = 20;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (porcentagem / 100) * circumference;

  return (
    <div
      className="absolute right-1.5 top-1.5 flex items-center justify-center"
      title={`${stats.letra}: ${porcentagem.toFixed(1)}% das respostas`}
      aria-label={`${stats.letra}: ${porcentagem.toFixed(1)}% das respostas`}
    >
      <div className="relative flex items-center justify-center">
        <svg style={{ width: size, height: size }}>
          <circle
            cy={center}
            cx={center}
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            className="stroke-gray-300 dark:stroke-gray-700/70"
          />

          <circle
            cy={center}
            cx={center}
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            className={
              stats.is_correta
                ? "stroke-emerald-400/80"
                : "stroke-gray-300/70 dark:stroke-gray-400/70"
            }
            strokeLinecap="butt"
            transform={`rotate(0, ${center}, ${center})`}
          />
        </svg>
      </div>
    </div>
  );
};

const QuizOption = ({
  alternativa,
  alternativaCorretaId,
  selecaoAtual,
  statusResposta,
  onSelect,
  serverFeedback,
  stats,
  showStats = false,
}: QuizOptionProps) => {
  const [isCut, setIsCut] = useState(false);
  const [showScissors, setShowScissors] = useState(false);

  const isSelected = selecaoAtual === alternativa.id;
  const isSubmitted = statusResposta !== "unanswered";

  const correctAlternativeId = serverFeedback?.gabarito || alternativaCorretaId;
  const isCorrectAnswer = alternativa.id === correctAlternativeId;

  let optionClass =
    "hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer transition-all duration-200";

  let circleClass =
    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-400 dark:border-gray-600 text-base font-bold text-gray-900 dark:text-white transition-all duration-200 mr-3";

  let textClass =
    "text-gray-900 dark:text-white font-light transition-all duration-200";

  if (isSelected && !isSubmitted) {
    optionClass =
      "bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-500";
    circleClass =
      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-700 dark:bg-blue-900 text-base font-bold text-white transition-all duration-200 mr-3";
  }

  if (isSubmitted) {
    if (isCorrectAnswer) {
      optionClass =
        "bg-green-100 dark:bg-green-900 border-green-500 cursor-default";
      circleClass =
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-700 dark:bg-green-900 text-base font-bold text-white transition-all duration-200 mr-3";
    } else if (isSelected && !isCorrectAnswer) {
      optionClass =
        "bg-red-100 dark:bg-red-900 border-red-500 cursor-default";
      circleClass =
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-red-500 bg-red-700 dark:bg-red-900 text-base font-bold text-white transition-all duration-200 mr-3";
    } else {
      optionClass = "cursor-default opacity-70";
    }
  }

  if (isCut) {
    optionClass += " opacity-40";
    textClass += " line-through text-gray-500 dark:text-gray-400";
  }

  const handleToggleCut = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsCut((current) => !current);
  };

  const handleSelect = () => {
    if (isSubmitted) return;

    if (isCut) {
      setIsCut(false);
      return;
    }

    onSelect(alternativa.id);
  };

  return (
    <div
      onClick={handleSelect}
      onMouseEnter={() => !isSubmitted && setShowScissors(true)}
      onMouseLeave={() => setShowScissors(false)}
      className={`group relative my-2 flex items-center rounded-lg border-2 border-transparent p-3 pr-10 ${optionClass}`}
    >
      <div className={circleClass}>{alternativa.letra.toUpperCase()}</div>

      <div
        className={`${textClass} markdown-body wmde-markdown wmde-markdown-color min-w-0 flex-1 overflow-hidden pr-2`}
        style={
          {
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
            "--color-canvas-default": "transparent",
            "--color-fg-default": isCut ? "#9CA3AF" : "currentColor",
          } as CSSProperties
        }
        dangerouslySetInnerHTML={{
          __html: alternativa.processedText || alternativa.texto,
        }}
      />

      {showStats && <AlternativeStatsMini stats={stats} />}

      {!isSubmitted && showScissors && (
        <button
          type="button"
          onClick={handleToggleCut}
          className="z-10 ml-2 flex-shrink-0 rounded-full border border-gray-300 bg-gray-100 p-1.5 shadow-lg transition-all duration-200 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          title={isCut ? "Recuperar alternativa" : "Cortar alternativa"}
        >
          <svg
            className={`h-4 w-4 ${
              isCut
                ? "text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                : "text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isCut ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
              />
            )}
          </svg>
        </button>
      )}
    </div>
  );
};

const QuestaoHeader = ({
  questao,
  index,
  topicsVisible,
  onToggleTopics,
  singleMode,
}: {
  questao: ModelQuestao;
  index: number;
  topicsVisible: boolean;
  onToggleTopics: () => void;
  singleMode: boolean;
}) => {
  const topicos = safeArray(questao.topicos);

  return (
    <div className="w-full border-b border-gray-200 bg-blue-50 dark:border-gray-700 dark:bg-blue-950">
      <div className="flex w-full flex-col overflow-hidden bg-gray-100 dark:bg-gray-800 sm:flex-row sm:items-center">
        <div className="flex flex-shrink-0 items-center gap-3 bg-gradient-to-br from-[#1F293C] to-[#2D3748] px-4 py-3 text-white sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium text-gray-300 sm:text-xs">
              QUESTÃO
            </span>
            <span className="text-xl font-bold text-white sm:text-2xl">
              {singleMode ? 1 : index + 1}
            </span>
          </div>

          <div className="h-8 w-px bg-gray-600" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium text-gray-300 sm:text-xs">
              ID
            </span>
            <span className="text-base font-semibold text-blue-300 sm:text-lg">
              #{questao.id}
            </span>
          </div>
        </div>

        <div className="relative flex min-h-[52px] flex-grow items-center justify-between bg-white px-4 py-3 text-gray-800 dark:bg-[#020617] dark:text-gray-100 sm:rounded-l-md sm:px-6">
          <button
            type="button"
            onClick={onToggleTopics}
            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-800 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200 sm:text-base"
          >
            {topicsVisible ? (
              <>
                Ocultar tópicos <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Ver tópicos <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>

          <AnimatePresence>
            {topicsVisible && (
              <motion.div
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 80, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-y-0 right-0 z-20 flex max-w-[80%] items-center gap-2 overflow-x-auto rounded-l-xl bg-blue-900 px-3 py-2 text-sm text-white shadow-lg sm:px-4"
              >
                <div className="flex items-center gap-2">
                  {topicos.length > 0 ? (
                    topicos.map((topico) => (
                      <span
                        key={topico.id}
                        className="whitespace-nowrap rounded-full bg-blue-700 px-2 py-1 text-xs font-semibold text-white shadow-md"
                      >
                        {topico.nome}
                      </span>
                    ))
                  ) : (
                    <span className="whitespace-nowrap rounded-full bg-blue-700 px-2 py-1 text-xs font-semibold text-white shadow-md">
                      Sem tópico
                    </span>
                  )}

                  <div className="ml-1 flex-shrink-0">
                    {getDifficultyBadge(questao.dificuldade)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const QuestaoFooter = ({
  isAnswered,
  activeTab,
  onToggleTab,
  children,
}: {
  questao: ModelQuestao;
  isAnswered: boolean;
  activeTab: QuestaoTab;
  onToggleTab: (tab: QuestaoTab) => void;
  children: React.ReactNode;
}) => {
  const getTabIcon = (tab: QuestaoTab) => {
    const isActive = activeTab === tab;

    return isActive ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="w-full rounded-b-lg bg-gray-100 dark:bg-gray-800">
      <div className="flex w-full flex-col items-stretch justify-around overflow-hidden rounded-lg sm:flex-row">
        <button
          type="button"
          onClick={() => onToggleTab("gabarito")}
          disabled={!isAnswered}
          className={`flex flex-1 cursor-pointer flex-row items-center justify-center gap-1 p-2 text-center font-bold transition duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-45 sm:gap-2 sm:p-3 ${
            activeTab === "gabarito"
              ? "bg-blue-900 text-white"
              : "text-gray-700 hover:text-blue-700 dark:text-gray-300 dark:hover:text-white"
          }`}
        >
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm md:text-base">
            Gabarito comentado
          </span>
          {getTabIcon("gabarito")}
        </button>

        <button
          type="button"
          onClick={() => onToggleTab("estatisticas")}
          disabled={!isAnswered}
          className={`flex flex-1 cursor-pointer flex-row items-center justify-center gap-1 border-t border-gray-200 p-2 text-center font-bold transition duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 sm:border-l sm:border-t-0 sm:gap-2 sm:p-3 ${
            activeTab === "estatisticas"
              ? "bg-blue-900 text-white"
              : "text-gray-700 hover:text-blue-700 dark:text-gray-300 dark:hover:text-white"
          }`}
        >
          <ChartColumn className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm md:text-base">Estatísticas</span>
          {getTabIcon("estatisticas")}
        </button>

        <button
          type="button"
          onClick={() => onToggleTab("duvida")}
          disabled={!isAnswered}
          className={`flex flex-1 cursor-pointer flex-row items-center justify-center gap-1 border-t border-gray-200 p-2 text-center font-bold transition duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 sm:border-l sm:border-t-0 sm:gap-2 sm:p-3 ${
            activeTab === "duvida"
              ? "bg-blue-900 text-white"
              : "text-gray-700 hover:text-blue-700 dark:text-gray-300 dark:hover:text-white"
          }`}
        >
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm md:text-base">Dúvida</span>
          {getTabIcon("duvida")}
        </button>
      </div>

      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-6 sm:pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ModelQuestions = ({
  questions,
  question,
  meta,
  className = "",
  startIndex = 0,
  singleMode = false,
  showEmptyState = true,
  isLoading = false,
}: ModelQuestionsProps) => {
  const { data: session } = useSession();
  const userToken = getTokenFromSession(session);

  const normalizedQuestions = useMemo(() => {
    if (question) return [question];

    return safeArray(questions);
  }, [question, questions]);

  const normalizedQuestionIds = useMemo(() => {
    return normalizedQuestions.map((questao) => questao.id).join(",");
  }, [normalizedQuestions]);

  const isSingleQuestion = singleMode || Boolean(question);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number | null>
  >({});

  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<number, boolean>
  >({});

  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<number, QuestaoTab>>({});
  const [openReportModalId, setOpenReportModalId] = useState<number | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState<Record<number, boolean>>({});
  const [serverFeedback, setServerFeedback] = useState<
    Record<number, ServerFeedback>
  >({});
  const [topicsVisible, setTopicsVisible] = useState<Record<number, boolean>>(
    {},
  );

  const [statsByQuestion, setStatsByQuestion] = useState<
    Record<number, QuestaoStats>
  >({});

  const [processedContent, setProcessedContent] = useState<
    Record<
      number,
      {
        enunciado: string;
        alternativas: Record<number, string>;
      }
    >
  >({});

  const [isProcessingContent, setIsProcessingContent] = useState(true);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const timeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  useEffect(() => {
    setSelectedAnswers({});
    setAnsweredQuestions({});
    setShowFeedback({});
    setActiveTabs({});
    setOpenReportModalId(null);
    setIsSubmitting({});
    setServerFeedback({});
    setTopicsVisible({});
    setStatsByQuestion({});
  }, [normalizedQuestionIds]);

  useEffect(() => {
    const processQuestionsContent = async () => {
      if (normalizedQuestions.length === 0) {
        setProcessedContent({});
        setIsProcessingContent(false);
        return;
      }

      setIsProcessingContent(true);

      const contentMap: Record<
        number,
        {
          enunciado: string;
          alternativas: Record<number, string>;
        }
      > = {};

      for (const questao of normalizedQuestions) {
        try {
          const enunciadoProcessado = await processMarkdown(questao.enunciado);

          const alternativasProcessadas: Record<number, string> = {};

          for (const alternativa of safeArray(questao.alternativas)) {
            alternativasProcessadas[alternativa.id] =
              await markdownProcessorAlternativas(alternativa.texto);
          }

          contentMap[questao.id] = {
            enunciado: enunciadoProcessado,
            alternativas: alternativasProcessadas,
          };
        } catch (error) {
          console.error(
            `Erro ao processar conteúdo da questão ${questao.id}:`,
            error,
          );

          contentMap[questao.id] = {
            enunciado: questao.enunciado,
            alternativas: safeArray(questao.alternativas).reduce(
              (acc, alternativa) => {
                acc[alternativa.id] = alternativa.texto;
                return acc;
              },
              {} as Record<number, string>,
            ),
          };
        }
      }

      setProcessedContent(contentMap);
      setIsProcessingContent(false);
    };

    processQuestionsContent();
  }, [normalizedQuestions]);

  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.tagName !== "IMG") return;

      const isInUserMenu =
        target.closest('[class*="UserMenu"]') ||
        target.closest('[class*="user-menu"]') ||
        target.closest('[class*="notification"]') ||
        target.closest("nav") ||
        target.closest("button") ||
        target.closest('[role="menu"]') ||
        target.closest('[role="dialog"]');

      const isInQuestionContent =
        target.closest(".markdown-body") ||
        target.closest('[class*="question"]') ||
        target.closest('[class*="questao"]') ||
        target.closest('[class*="gabarito"]') ||
        target.closest('[class*="alternativa"]') ||
        target.closest('[class*="explicacao"]');

      if (isInQuestionContent && !isInUserMenu) {
        const src = target.getAttribute("src");

        if (src) {
          setZoomedImageUrl(src);
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    document.addEventListener("click", handleImageClick, true);

    return () => {
      document.removeEventListener("click", handleImageClick, true);
    };
  }, []);

  const closeLightbox = useCallback(() => {
    setZoomedImageUrl(null);
  }, []);

  const isQuestionAnswered = useCallback(
    (questionId: number) => {
      return answeredQuestions[questionId] || false;
    },
    [answeredQuestions],
  );

  const guardarEstatisticasDaResposta = (
    questionId: number,
    resultado: any,
  ) => {
    const estatisticas = resultado?.estatisticas;

    if (!estatisticas) return;

    setStatsByQuestion((prev) => ({
      ...prev,
      [questionId]: estatisticas,
    }));
  };

  const getStatsDaAlternativa = (
    questaoId: number,
    alternativaId: number,
  ): QuestaoAlternativeStats | null => {
    const stats = statsByQuestion[questaoId];

    const alternativas =
      stats?.alternativas ?? stats?.alternativas_stats ?? [];

    return (
      alternativas.find((item) => Number(item.id) === Number(alternativaId)) ??
      null
    );
  };

  useEffect(() => {
    if (!userToken) return;

    const questoesRespondidas = normalizedQuestions
      .filter((questao) => isQuestionAnswered(questao.id))
      .filter((questao) => !statsByQuestion[questao.id]);

    if (questoesRespondidas.length === 0) return;

    let cancelado = false;

    const carregar = async () => {
      const resultados = await Promise.allSettled(
        questoesRespondidas.map(async (questao) => {
          const stats = await getQuestaoStats(userToken, questao.id);

          return {
            questaoId: questao.id,
            stats,
          };
        }),
      );

      if (cancelado) return;

      setStatsByQuestion((prev) => {
        const next = { ...prev };

        resultados.forEach((resultado) => {
          if (resultado.status === "fulfilled") {
            next[resultado.value.questaoId] = resultado.value.stats;
          }
        });

        return next;
      });
    };

    carregar();

    return () => {
      cancelado = true;
    };
  }, [
    userToken,
    normalizedQuestions,
    statsByQuestion,
    isQuestionAnswered,
    answeredQuestions,
  ]);

  const handleSelectAnswer = (questionId: number, alternativaId: number) => {
    if (answeredQuestions[questionId]) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: alternativaId,
    }));
  };

  const handleConfirmAnswer = async (
    questionId: number,
    alternativaCorretaId: number,
  ) => {
    const selectedId = selectedAnswers[questionId];

    if (selectedId === undefined || selectedId === null) return;

    if (!userToken) {
      console.error("Usuário não autenticado");
      alert("Usuário não autenticado. Faça login novamente.");
      return;
    }

    setIsSubmitting((prev) => ({
      ...prev,
      [questionId]: true,
    }));

    try {
      const resultado = await responderQuestaoAvulsa(
        questionId,
        selectedId,
        userToken,
      );

      const feedback = normalizeFeedback(resultado, alternativaCorretaId);

      guardarEstatisticasDaResposta(questionId, resultado);

      setServerFeedback((prev) => ({
        ...prev,
        [questionId]: feedback,
      }));

      setAnsweredQuestions((prev) => ({
        ...prev,
        [questionId]: true,
      }));

      setShowFeedback((prev) => ({
        ...prev,
        [questionId]: true,
      }));

      const timeoutId = setTimeout(() => {
        setShowFeedback((prev) => ({
          ...prev,
          [questionId]: false,
        }));
      }, 2000);

      timeoutsRef.current[questionId] = timeoutId;
    } catch (error) {
      console.error("Erro ao enviar resposta avulsa:", error);
      alert("Erro ao responder a questão. Tente novamente.");
    } finally {
      setIsSubmitting((prev) => ({
        ...prev,
        [questionId]: false,
      }));
    }
  };

  const openReportModal = (questaoId: number) => {
    setOpenReportModalId(questaoId);
  };

  const closeReportModal = () => {
    setOpenReportModalId(null);
  };

  const toggleTab = (questionId: number, tab: QuestaoTab) => {
    setActiveTabs((prev) => {
      const currentTab = prev[questionId];

      if (currentTab === tab) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }

      return {
        ...prev,
        [questionId]: tab,
      };
    });
  };

  const toggleTopics = (questionId: number) => {
    setTopicsVisible((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const renderActiveTabContent = (questao: ModelQuestao) => {
    const activeTab = activeTabs[questao.id];

    if (!activeTab) return null;

    const content = {
      gabarito: (
        <GabaritoQuestao
          questaoId={questao.id}
          gabaritoVideo={questao.gabarito_video || undefined}
          gabaritoComentado={questao.gabarito_comentado_texto || ""}
        />
      ),
      duvida: (
        <DuvidaQuestao questaoId={questao.id} enunciado={questao.enunciado} />
      ),
      estatisticas: (
        <EstatisticasQuestao
          questaoId={questao.id}
          dificuldade={questao.dificuldade ?? undefined}
          token={userToken}
        />
      ),
    };

    return content[activeTab];
  };

  if (isLoading || isProcessingContent) {
    return (
      <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
        <MultipleQuestionSkeleton
          count={Math.max(normalizedQuestions.length || 1, 1)}
        />
      </div>
    );
  }

  if (normalizedQuestions.length === 0) {
    if (!showEmptyState) return null;

    return (
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/10 dark:bg-white/[0.03] ${className}`}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Nenhuma questão encontrada
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Altere os filtros selecionados para ampliar a busca.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto">
        <div
          className={[
            isSingleQuestion ? "mx-auto max-w-5xl" : "mx-auto max-w-7xl",
            "p-0 sm:p-4 lg:p-6",
          ].join(" ")}
        >
          <main>
            {normalizedQuestions.map((questao, index) => {
              const selectedId = selectedAnswers[questao.id] ?? null;
              const isAnswered = isQuestionAnswered(questao.id);
              const feedback = serverFeedback[questao.id];

              const statusResposta = isAnswered
                ? feedback?.is_correct
                  ? "correct"
                  : "incorrect"
                : "unanswered";

              const enunciadoProcessado =
                processedContent[questao.id]?.enunciado || questao.enunciado;

              return (
                <div
                  key={questao.id}
                  id={`questao-${questao.id}`}
                  data-question-id={questao.id}
                  className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-[#616161] dark:bg-[#00091A]"
                >
                  <QuestaoHeader
                    questao={questao}
                    index={startIndex + index}
                    topicsVisible={!!topicsVisible[questao.id]}
                    onToggleTopics={() => toggleTopics(questao.id)}
                    singleMode={isSingleQuestion}
                  />

                  <div className="my-2 flex flex-col items-start justify-between gap-2 border-b border-gray-200 px-4 pb-3 text-sm font-medium dark:border-gray-700 sm:my-4 sm:flex-row sm:items-center sm:gap-3 sm:px-6 sm:pb-4">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {questao.prova?.sigla && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300 sm:px-3 sm:text-sm">
                          {questao.prova.sigla}
                        </span>
                      )}

                      {questao.prova?.ano && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300 sm:px-3 sm:text-sm">
                          {questao.prova.ano}
                        </span>
                      )}

                      {questao.prova?.banca?.sigla && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300 sm:px-3 sm:text-sm">
                          {questao.prova.banca.sigla}
                        </span>
                      )}

                      {!!questao.adaptado && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300 sm:px-3 sm:text-sm">
                          Questão Adaptada
                        </span>
                      )}
                    </div>

                    <div className="mt-1 sm:mt-0">
                      <OpcoesQuestao
                        questao={questao as any}
                        onReport={() => openReportModal(questao.id)}
                      />
                    </div>
                  </div>

                  <section className="relative p-4 sm:p-6">
                    <div
                      className="markdown-body wmde-markdown wmde-markdown-color mb-4 text-sm leading-relaxed text-gray-800 dark:text-gray-200 sm:mb-6 sm:text-base"
                      style={
                        {
                          lineHeight: "1.25rem",
                          "--color-canvas-default": "transparent",
                          "--color-fg-default": "currentColor",
                        } as CSSProperties
                      }
                      dangerouslySetInnerHTML={{
                        __html: enunciadoProcessado,
                      }}
                    />

                    <div className="relative">
                      {safeArray(questao.alternativas).map((alternativa) => {
                        const alternativaProcessada: SimpleAlternativa = {
                          ...alternativa,
                          processedText:
                            processedContent[questao.id]?.alternativas[
                              alternativa.id
                            ],
                        };

                        return (
                          <QuizOption
                            key={alternativa.id}
                            alternativa={alternativaProcessada}
                            alternativaCorretaId={
                              feedback?.gabarito ||
                              questao.alternativa_correta_id
                            }
                            selecaoAtual={selectedId}
                            statusResposta={statusResposta}
                            onSelect={(alternativaId) =>
                              handleSelectAnswer(questao.id, alternativaId)
                            }
                            serverFeedback={feedback}
                            stats={getStatsDaAlternativa(
                              questao.id,
                              alternativa.id,
                            )}
                            showStats={isAnswered}
                          />
                        );
                      })}

                      {showFeedback[questao.id] && (
                        <AnswerFeedbackOverlay
                          status={
                            feedback?.is_correct ? "correct" : "incorrect"
                          }
                          onAnimationEnd={() => {}}
                        />
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          handleConfirmAnswer(
                            questao.id,
                            questao.alternativa_correta_id,
                          )
                        }
                        disabled={
                          isAnswered ||
                          selectedId == null ||
                          Boolean(isSubmitting[questao.id])
                        }
                        className="w-full cursor-pointer rounded-lg bg-[#0E00D0] px-6 py-2 text-sm font-bold text-white shadow-lg transition duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 sm:py-3 sm:text-base"
                      >
                        {isSubmitting[questao.id] ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                            Enviando...
                          </span>
                        ) : isAnswered ? (
                          "Respondida"
                        ) : (
                          "Responder"
                        )}
                      </button>
                    </div>
                  </section>

                  <QuestaoFooter
                    questao={questao}
                    isAnswered={isAnswered}
                    activeTab={activeTabs[questao.id]}
                    onToggleTab={(tab) => toggleTab(questao.id, tab)}
                  >
                    {renderActiveTabContent(questao)}
                  </QuestaoFooter>

                  {openReportModalId && (
                    <ReportarModal
                      questaoId={openReportModalId}
                      onClose={closeReportModal}
                      token={userToken || ""}
                    />
                  )}
                </div>
              );
            })}
          </main>
        </div>
      </div>

      {zoomedImageUrl && (
        <ImageLightbox imageUrl={zoomedImageUrl} onClose={closeLightbox} />
      )}
    </div>
  );
};

export default ModelQuestions;
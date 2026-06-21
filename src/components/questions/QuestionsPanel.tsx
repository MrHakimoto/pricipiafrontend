// components/questions/QuestionsPanel.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ChartColumn,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

import { salvarResposta } from "@/lib/questions/tentativa";
import { useNavigation } from "@/contexts/NavigationContext";
import {
  getQuestaoStats,
  type QuestaoStats,
  type QuestaoAlternativeStats,
} from "@/lib/questions/estatisticas";

import type {
  QuestaoBase,
  RespostaQuestao,
  RespostasPorQuestao,
  GabaritoCertoErrado,
} from "@/types/questions";

import { QuestionWrapper } from "./QuestionWrapper";
import { GabaritoQuestao } from "./feedback/gabarito";
import { DuvidaQuestao } from "./feedback/duvida";
import { EstatisticasQuestao } from "./feedback/estatisticas";
import ReportarModal from "@/components/questions/ReportModal";
import OpcoesQuestao from "@/components/questions/OpcoesQuestao";
import { RefazerListaButton } from "./RefazerListaButton";
import { processMarkdown } from "@/utils/markdownProcessor";
import { markdownProcessorAlternativas } from "@/utils/markdownProcessorAlternativas";
import { MultipleQuestionSkeleton } from "../Skeletons/QuestionSkeleton";
import { ImageLightbox } from "@/components/editor/ImageLightbox";

type FeedbackStatus = "correct" | "incorrect" | "neutral";

type AnswerFeedbackOverlayProps = {
  show: boolean;
  status: FeedbackStatus;
  title?: string;
  subtitle?: string;
};

const AnswerFeedbackOverlay = ({
  show,
  status,
  title,
  subtitle,
}: AnswerFeedbackOverlayProps) => {
  if (!show) return null;

  const meta = {
    correct: {
      icon: CheckCircle2,
      title: title ?? "Correto",
      subtitle: subtitle ?? "Sua resposta foi registrada como correta.",
      className:
        "border-emerald-500/40 bg-emerald-50 text-emerald-900 shadow-emerald-200/60 dark:bg-emerald-950/90 dark:text-emerald-100 dark:shadow-emerald-950/30",
      iconClassName: "text-emerald-600 dark:text-emerald-400",
    },
    incorrect: {
      icon: XCircle,
      title: title ?? "Incorreto",
      subtitle: subtitle ?? "Veja o gabarito e a explicação abaixo.",
      className:
        "border-red-500/40 bg-red-50 text-red-900 shadow-red-200/60 dark:bg-red-950/90 dark:text-red-100 dark:shadow-red-950/30",
      iconClassName: "text-red-600 dark:text-red-400",
    },
    neutral: {
      icon: Info,
      title: title ?? "Resposta registrada",
      subtitle: subtitle ?? "Confira o gabarito e a resolução abaixo.",
      className:
        "border-blue-500/40 bg-blue-50 text-blue-900 shadow-blue-200/60 dark:bg-blue-950/90 dark:text-blue-100 dark:shadow-blue-950/30",
      iconClassName: "text-blue-600 dark:text-blue-400",
    },
  }[status];

  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className={`pointer-events-none absolute right-4 top-4 z-30 flex max-w-[280px] items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${meta.className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${meta.iconClassName}`} />

      <div>
        <p className="text-sm font-bold">{meta.title}</p>
        <p className="mt-0.5 text-xs opacity-85">{meta.subtitle}</p>
      </div>
    </motion.div>
  );
};

type SimpleAlternativa = {
  id: number;
  letra: string;
  texto: string;
  processedText?: string;
};

type QuizOptionProps = {
  alternativa: SimpleAlternativa;
  questaoId: number;
  alternativaCorretaId: number | null | undefined;
  selecaoAtual: number | null;
  statusResposta: "unanswered" | "correct" | "incorrect";
  stats?: QuestaoAlternativeStats | null;
  showStats?: boolean;
  onSelect: (alternativaId: number) => void;
};

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
  stats,
  showStats = false,
}: QuizOptionProps) => {
  const [isCut, setIsCut] = useState(false);
  const [showScissors, setShowScissors] = useState(false);

  const isSelected = selecaoAtual === alternativa.id;
  const isSubmitted = statusResposta !== "unanswered";
  const isCorrectAnswer = alternativa.id === alternativaCorretaId;

  let optionClass =
    "hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer transition-all duration-200";
  let circleClass =
    "flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white mr-3 text-base font-bold transition-all duration-200 flex-shrink-0";
  let textClass =
    "text-gray-900 dark:text-white font-light transition-all duration-200";

  if (isSelected && !isSubmitted) {
    optionClass =
      "bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-500";
    circleClass =
      "flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-500 text-white mr-3 text-base font-bold transition-all duration-200 bg-blue-700 dark:bg-blue-900 flex-shrink-0";
  }

  if (isSubmitted) {
    if (isCorrectAnswer) {
      optionClass =
        "bg-green-100 dark:bg-green-900 border-green-500 cursor-default";
      circleClass =
        "flex items-center justify-center w-8 h-8 rounded-full border-2 border-green-500 text-white mr-3 text-base font-bold transition-all duration-200 bg-green-700 dark:bg-green-900 flex-shrink-0";
    } else if (isSelected && !isCorrectAnswer) {
      optionClass = "bg-red-100 dark:bg-red-900 border-red-500 cursor-default";
      circleClass =
        "flex items-center justify-center w-8 h-8 rounded-full border-2 border-red-500 text-white mr-3 text-base font-bold transition-all duration-200 bg-red-700 dark:bg-red-900 flex-shrink-0";
    } else {
      optionClass = "cursor-default opacity-70";
    }
  }

  if (isCut) {
    optionClass += " opacity-40";
    textClass += " line-through text-gray-500 dark:text-gray-400";
  }

  const handleToggleCut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCut((prev) => !prev);
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
      className={`flex items-center p-3 pr-10 my-2 rounded-lg border-2 border-transparent relative group ${optionClass}`}
    >
      <div className={circleClass}>{alternativa.letra.toUpperCase()}</div>

      <div
        className={`${textClass} markdown-body wmde-markdown wmde-markdown-color flex-1 min-w-0 overflow-hidden pr-2`}
        style={
          {
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
            "--color-canvas-default": "transparent",
            "--color-fg-default": isCut ? "#9CA3AF" : "currentColor",
          } as React.CSSProperties
        }
        dangerouslySetInnerHTML={{
          __html: alternativa.processedText || alternativa.texto,
        }}
      />
      {showStats && <AlternativeStatsMini stats={stats} />}

      {!isSubmitted && showScissors && (
        <button
          onClick={handleToggleCut}
          className="flex-shrink-0 ml-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1.5 border border-gray-300 dark:border-gray-600 shadow-lg transition-all duration-200 z-10"
          title={isCut ? "Recuperar alternativa" : "Cortar alternativa"}
        >
          <svg
            className={`w-4 h-4 ${
              isCut
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300"
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

type QuestaoTab = "gabarito" | "duvida" | "estatisticas" | null;

interface QuestionsPanelProps {
  questions: QuestaoBase[];
  className?: string;
  resolucaoId: number | null;
  respostasSalvas: RespostasPorQuestao;
  onIniciarTentativa: () => Promise<number>;
  listaId?: number;
  listaTipo?: string;
  tempoEncerrado?: boolean;
  simuladoFinalizado?: boolean;
}

export const QuestionsPanel: React.FC<QuestionsPanelProps> = ({
  questions,
  className = "",
  resolucaoId: propResolucaoId,
  respostasSalvas,
  onIniciarTentativa,
  listaTipo,
  tempoEncerrado = false,
  simuladoFinalizado = false,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number | null>
  >({});

  const [numericAnswers, setNumericAnswers] = useState<Record<number, string>>(
    {},
  );

  const [certoErradoAnswers, setCertoErradoAnswers] = useState<
    Record<number, GabaritoCertoErrado | null>
  >({});

  const [discursiveAnswers, setDiscursiveAnswers] = useState<
    Record<number, string>
  >({});

  const [discursiveRevealed, setDiscursiveRevealed] = useState<
    Record<number, boolean>
  >({});

  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<number, boolean>
  >({});

  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});

  const [questionFeedbackStatuses, setQuestionFeedbackStatuses] = useState<
    Record<number, FeedbackStatus>
  >({});

  const [activeTabs, setActiveTabs] = useState<Record<number, QuestaoTab>>({});
  const [openReportModalId, setOpenReportModalId] = useState<number | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState<Record<number, boolean>>({});
  const [currentResolucaoId, setCurrentResolucaoId] = useState<number | null>(
    propResolucaoId,
  );
  const [topicsVisible, setTopicsVisible] = useState<Record<number, boolean>>(
    {},
  );

  const [tentativaFinalizada, setTentativaFinalizada] = useState(false);
  const [isRefazendoLista, setIsRefazendoLista] = useState(false);

  const [processedContent, setProcessedContent] = useState<
    Record<
      number,
      {
        enunciado: string;
        respostaEsperada?: string;
        criterioCorrecao?: string;
        alternativas: Record<number, string>;
      }
    >
  >({});

  const [isProcessingContent, setIsProcessingContent] = useState(true);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [statsByQuestion, setStatsByQuestion] = useState<
    Record<number, QuestaoStats>
  >({});

  const { data: session } = useSession();
  const userToken = session?.laravelToken || "";

  const { todasQuestoesRespondidas, updateQuestionStatus, progresso } =
    useNavigation();

  const isSimuladoOuProva = Boolean(
    listaTipo && ["simulado", "prova"].includes(listaTipo),
  );

  const deveMostrarCorrecao = !isSimuladoOuProva || simuladoFinalizado;
  const respostasBloqueadas = tempoEncerrado || simuladoFinalizado;

  const podeMostrarEstatisticasNasAlternativas =
    !isSimuladoOuProva || simuladoFinalizado;

  useEffect(() => {
    const respostasEntries = Object.entries(respostasSalvas || {});

    if (respostasEntries.length === 0) {
      setSelectedAnswers({});
      setNumericAnswers({});
      setCertoErradoAnswers({});
      setDiscursiveAnswers({});
      setAnsweredQuestions({});
      setQuestionFeedbackStatuses({});
      return;
    }

    const newSelectedAnswers: Record<number, number | null> = {};
    const newNumericAnswers: Record<number, string> = {};
    const newCertoErradoAnswers: Record<number, GabaritoCertoErrado | null> =
      {};
    const newDiscursiveAnswers: Record<number, string> = {};
    const newAnsweredQuestions: Record<number, boolean> = {};
    const newFeedbackStatuses: Record<number, FeedbackStatus> = {};

    respostasEntries.forEach(([questaoIdString, resposta]) => {
      const questaoId = Number(questaoIdString);

      if (!questaoId || !resposta) return;

      newAnsweredQuestions[questaoId] = true;

      if (resposta.tipo === "objetiva") {
        newSelectedAnswers[questaoId] = resposta.alternativa_id;
      }

      if (resposta.tipo === "resposta_numerica") {
        newNumericAnswers[questaoId] = resposta.resposta_numerica ?? "";
      }

      if (resposta.tipo === "certo_errado") {
        newCertoErradoAnswers[questaoId] =
          resposta.resposta_certo_errado ?? null;
      }

      if (resposta.tipo === "discursiva") {
        newDiscursiveAnswers[questaoId] = resposta.resposta_texto ?? "";
      }

      if (resposta.correta === true) {
        newFeedbackStatuses[questaoId] = "correct";
      } else if (resposta.correta === false) {
        newFeedbackStatuses[questaoId] = "incorrect";
      } else {
        newFeedbackStatuses[questaoId] = "neutral";
      }

      if (isSimuladoOuProva && !simuladoFinalizado) {
        updateQuestionStatus(questaoId, "answered");
        return;
      }

      if (resposta.correta === true) {
        updateQuestionStatus(questaoId, "correct");
        return;
      }

      if (resposta.correta === false) {
        updateQuestionStatus(questaoId, "incorrect");
        return;
      }

      updateQuestionStatus(questaoId, "answered");
    });

    setSelectedAnswers(newSelectedAnswers);
    setNumericAnswers(newNumericAnswers);
    setCertoErradoAnswers(newCertoErradoAnswers);
    setDiscursiveAnswers(newDiscursiveAnswers);
    setAnsweredQuestions(newAnsweredQuestions);
    setQuestionFeedbackStatuses(newFeedbackStatuses);
  }, [
    respostasSalvas,
    isSimuladoOuProva,
    simuladoFinalizado,
    updateQuestionStatus,
  ]);

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

  useEffect(() => {
    if (isSimuladoOuProva) {
      setTentativaFinalizada(false);
      return;
    }

    const listaRealmenteConcluida =
      progresso.total > 0 && progresso.respondidas >= progresso.total;

    setTentativaFinalizada(listaRealmenteConcluida);
  }, [isSimuladoOuProva, progresso.respondidas, progresso.total]);

  useEffect(() => {
    setCurrentResolucaoId(propResolucaoId);
  }, [propResolucaoId]);

  useEffect(() => {
    if (!userToken || !podeMostrarEstatisticasNasAlternativas) return;

    const questoesRespondidas = questions
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
    questions,
    statsByQuestion,
    podeMostrarEstatisticasNasAlternativas,
    answeredQuestions,
    respostasSalvas,
  ]);

  useEffect(() => {
    const processQuestionsContent = async () => {
      setIsProcessingContent(true);

      const contentMap: Record<
        number,
        {
          enunciado: string;
          respostaEsperada?: string;
          criterioCorrecao?: string;
          alternativas: Record<number, string>;
        }
      > = {};

      for (const questao of questions) {
        try {
          const enunciadoProcessado = await processMarkdown(questao.enunciado);

          const respostaEsperadaProcessada = questao.resposta_esperada
            ? await processMarkdown(questao.resposta_esperada)
            : undefined;

          const criterioCorrecaoProcessado = questao.criterio_correcao
            ? await processMarkdown(questao.criterio_correcao)
            : undefined;

          const alternativasProcessadas: Record<number, string> = {};

          for (const alternativa of questao.alternativas ?? []) {
            const altProcessada = await markdownProcessorAlternativas(
              alternativa.texto,
            );
            alternativasProcessadas[alternativa.id] = altProcessada;
          }

          contentMap[questao.id] = {
            enunciado: enunciadoProcessado,
            respostaEsperada: respostaEsperadaProcessada,
            criterioCorrecao: criterioCorrecaoProcessado,
            alternativas: alternativasProcessadas,
          };
        } catch (error) {
          console.error(
            `Erro ao processar conteúdo da questão ${questao.id}:`,
            error,
          );

          contentMap[questao.id] = {
            enunciado: questao.enunciado,
            respostaEsperada: questao.resposta_esperada ?? undefined,
            criterioCorrecao: questao.criterio_correcao ?? undefined,
            alternativas: (questao.alternativas ?? []).reduce(
              (acc, alt) => {
                acc[alt.id] = alt.texto;
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
  }, [questions]);

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

    const alternativas = stats?.alternativas ?? stats?.alternativas_stats ?? [];

    return (
      alternativas.find((item) => Number(item.id) === Number(alternativaId)) ??
      null
    );
  };

  const openFeedbackAndGabarito = (
    questionId: number,
    status: FeedbackStatus = "neutral",
  ) => {
    if (isSimuladoOuProva && !simuladoFinalizado) return;

    setQuestionFeedbackStatuses((prev) => ({
      ...prev,
      [questionId]: status,
    }));

    setShowFeedback((prev) => ({
      ...prev,
      [questionId]: true,
    }));

    window.setTimeout(() => {
      setShowFeedback((prev) => ({
        ...prev,
        [questionId]: false,
      }));
    }, 2000);
  };

  const handleRefazerLista = async () => {
    setIsRefazendoLista(true);

    try {
      await onIniciarTentativa();
      window.location.reload();
    } catch (error) {
      console.error("Erro ao refazer lista:", error);
      alert("Erro ao reiniciar a lista. Tente novamente.");
      setIsRefazendoLista(false);
    }
  };

  const normalizeAnswerText = (value: unknown) => {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(",", ".");
  };

  const getExpectedNumericAnswer = (questao: QuestaoBase) => {
    const q = questao as any;

    return (
      q.resposta_esperada ??
      q.resposta_correta ??
      q.gabarito ??
      q.gabarito_texto ??
      q.answer ??
      null
    );
  };

  const getQuestionFeedbackStatus = (questao: QuestaoBase): FeedbackStatus => {
    const localStatus = questionFeedbackStatuses[questao.id];

    if (localStatus) {
      return localStatus;
    }

    const respostaSalva = respostasSalvas[questao.id];

    if (respostaSalva?.correta === true) {
      return "correct";
    }

    if (respostaSalva?.correta === false) {
      return "incorrect";
    }

    if (!answeredQuestions[questao.id]) {
      return "neutral";
    }

    if (questao.tipo === "objetiva") {
      return selectedAnswers[questao.id] === questao.alternativa_correta_id
        ? "correct"
        : "incorrect";
    }

    if (questao.tipo === "resposta_numerica") {
      const userAnswer = normalizeAnswerText(numericAnswers[questao.id]);
      const expectedAnswer = normalizeAnswerText(
        questao.resposta_numerica ?? getExpectedNumericAnswer(questao),
      );

      if (!expectedAnswer) return "neutral";

      return userAnswer === expectedAnswer ? "correct" : "incorrect";
    }

    if (questao.tipo === "certo_errado") {
      const userAnswer = certoErradoAnswers[questao.id];
      const expectedAnswer = questao.gabarito_certo_errado;

      if (!userAnswer || !expectedAnswer) return "neutral";

      return userAnswer === expectedAnswer ? "correct" : "incorrect";
    }

    return "neutral";
  };

  const getQuestionFeedbackText = (questao: QuestaoBase) => {
    const status = getQuestionFeedbackStatus(questao);

    if (questao.tipo === "discursiva") {
      return {
        status,
        title: "Resposta registrada",
        subtitle: "Compare sua resposta com o gabarito esperado abaixo.",
      };
    }

    if (status === "correct") {
      return {
        status,
        title: "Correto",
        subtitle:
          "Muito bem. Confira a resolução para consolidar o raciocínio.",
      };
    }

    if (status === "incorrect") {
      return {
        status,
        title: "Incorreto",
        subtitle: "Veja o gabarito e entenda exatamente onde ocorreu o erro.",
      };
    }

    return {
      status,
      title: "Resposta registrada",
      subtitle: "Confira o gabarito e a explicação abaixo.",
    };
  };

  const deveMostrarBotaoRefazer = useMemo(() => {
    if (isSimuladoOuProva) {
      return false;
    }

    const listaRealmenteConcluida =
      progresso.total > 0 && progresso.respondidas >= progresso.total;

    return (
      listaRealmenteConcluida &&
      (todasQuestoesRespondidas || tentativaFinalizada)
    );
  }, [
    isSimuladoOuProva,
    progresso.respondidas,
    progresso.total,
    todasQuestoesRespondidas,
    tentativaFinalizada,
  ]);

  const garantirResolucaoId = async (): Promise<number> => {
    let resolucaoId = currentResolucaoId;

    if (!resolucaoId) {
      resolucaoId = await onIniciarTentativa();
      setCurrentResolucaoId(resolucaoId);
    }

    return resolucaoId;
  };

  const salvarRespostaUniversal = async (
    questionId: number,
    resposta: RespostaQuestao,
    status: "correct" | "incorrect" | "answered",
  ) => {
    setIsSaving((prev) => ({ ...prev, [questionId]: true }));

    try {
      const resolucaoId = await garantirResolucaoId();

      const resultado = await salvarResposta(resolucaoId, resposta, userToken);

      guardarEstatisticasDaResposta(questionId, resultado);

      setAnsweredQuestions((prev) => ({
        ...prev,
        [questionId]: true,
      }));

      openFeedbackAndGabarito(
        questionId,
        status === "correct"
          ? "correct"
          : status === "incorrect"
            ? "incorrect"
            : "neutral",
      );

      if (!isSimuladoOuProva) {
        updateQuestionStatus(questionId, status);
      } else {
        updateQuestionStatus(questionId, "answered");
      }

      return resultado;
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
      alert("Erro ao salvar resposta. Tente novamente.");
      return null;
    } finally {
      setIsSaving((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSelectAnswer = (questionId: number, alternativaId: number) => {
    if (answeredQuestions[questionId]) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: alternativaId,
    }));
  };

  const handleConfirmObjetiva = async (
    questaoId: number,
    alternativaCorretaId?: number | null,
  ) => {
    if (tempoEncerrado || simuladoFinalizado) {
      alert("Esta tentativa já foi finalizada.");
      return;
    }

    const alternativaId = selectedAnswers[questaoId];

    if (!alternativaId) {
      alert("Selecione uma alternativa.");
      return;
    }

    setIsSaving((prev) => ({ ...prev, [questaoId]: true }));

    try {
      const resolucaoId = await garantirResolucaoId();

      const resposta: RespostaQuestao = {
        tipo: "objetiva",
        questao_id: questaoId,
        alternativa_id: alternativaId,
      };

      const response = await salvarResposta(resolucaoId, resposta, userToken);

      guardarEstatisticasDaResposta(questaoId, response);

      setAnsweredQuestions((prev) => ({
        ...prev,
        [questaoId]: true,
      }));

      /**
       * SIMULADO EM ANDAMENTO:
       * não mostra correto/incorreto.
       * sidebar fica azul.
       * alternativa marcada fica azul.
       */
      if (isSimuladoOuProva && !simuladoFinalizado) {
        updateQuestionStatus(questaoId, "answered");
        return;
      }

      /**
       * LISTA NORMAL:
       * mostra correção imediatamente.
       */
      const isCorrect = alternativaId === alternativaCorretaId;

      updateQuestionStatus(questaoId, isCorrect ? "correct" : "incorrect");

      openFeedbackAndGabarito(questaoId, isCorrect ? "correct" : "incorrect");

      if (response?.resolucao_status === "terminado") {
        setTentativaFinalizada(true);
      }
    } catch (error) {
      console.error("Erro ao salvar resposta objetiva:", error);
      alert("Erro ao salvar resposta. Tente novamente.");
    } finally {
      setIsSaving((prev) => ({
        ...prev,
        [questaoId]: false,
      }));
    }
  };

  const normalizeNumericAnswer = (value: string | null | undefined) => {
    return String(value ?? "")
      .trim()
      .replace(",", ".")
      .replace(/\s+/g, "");
  };

  const handleConfirmRespostaNumerica = async (questao: QuestaoBase) => {
    const valor = numericAnswers[questao.id]?.trim();

    if (!valor) return;

    const temGabarito = Boolean(questao.resposta_numerica?.trim());

    const isCorrect = temGabarito
      ? normalizeNumericAnswer(valor) ===
        normalizeNumericAnswer(questao.resposta_numerica)
      : null;

    await salvarRespostaUniversal(
      questao.id,
      {
        tipo: "resposta_numerica",
        questao_id: questao.id,
        resposta_numerica: valor,
        correta: isCorrect,
      },
      isCorrect === true
        ? "correct"
        : isCorrect === false
          ? "incorrect"
          : "answered",
    );
  };

  const handleConfirmCertoErrado = async (questao: QuestaoBase) => {
    const resposta = certoErradoAnswers[questao.id];

    if (!resposta) return;

    const isCorrect = questao.gabarito_certo_errado
      ? JSON.stringify(resposta) ===
        JSON.stringify(questao.gabarito_certo_errado)
      : null;

    await salvarRespostaUniversal(
      questao.id,
      {
        tipo: "certo_errado",
        questao_id: questao.id,
        resposta_certo_errado: resposta,
        correta: isCorrect,
      },
      isCorrect === true
        ? "correct"
        : isCorrect === false
          ? "incorrect"
          : "answered",
    );
  };

  const handleRevealDiscursiva = (questaoId: number) => {
    const texto = discursiveAnswers[questaoId]?.trim();

    if (!texto) return;

    setDiscursiveRevealed((prev) => ({
      ...prev,
      [questaoId]: true,
    }));
  };

  const handleAutoAvaliarDiscursiva = async (
    questao: QuestaoBase,
    correta: boolean,
  ) => {
    const texto = discursiveAnswers[questao.id]?.trim();

    if (!texto) return;

    await salvarRespostaUniversal(
      questao.id,
      {
        tipo: "discursiva",
        questao_id: questao.id,
        resposta_texto: texto,
        correta,
      },
      correta ? "correct" : "incorrect",
    );
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
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
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

  const isQuestionAnswered = (questionId: number) => {
    const respostaSalva = respostasSalvas[questionId];

    /**
     * Depois que o simulado foi finalizado, até questão em branco
     * precisa ser considerada "respondida" para liberar revisão/gabarito.
     */
    if (simuladoFinalizado && respostaSalva) {
      return true;
    }

    return answeredQuestions[questionId] || false;
  };

  const getTabIcon = (questionId: number, tab: QuestaoTab) => {
    const isActive = activeTabs[questionId] === tab;

    return isActive ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const getDifficultyBadge = (dificuldade?: number | null) => {
    switch (dificuldade) {
      case 1:
        return (
          <div className="border-2 border-green-400 bg-green-100 text-green-800 rounded-lg px-3 py-1 text-sm font-semibold">
            Muito Fácil
          </div>
        );
      case 2:
        return (
          <div className="border-2 border-lime-400 bg-lime-100 text-lime-800 rounded-lg px-3 py-1 text-sm font-semibold">
            Fácil
          </div>
        );
      case 3:
        return (
          <div className="border-2 border-yellow-400 bg-yellow-100 text-yellow-800 rounded-lg px-3 py-1 text-sm font-semibold">
            Médio
          </div>
        );
      case 4:
        return (
          <div className="border-2 border-orange-500 bg-orange-100 text-orange-800 rounded-lg px-3 py-1 text-sm font-semibold">
            Difícil
          </div>
        );
      case 5:
        return (
          <div className="border-2 border-red-500 bg-red-100 text-red-800 rounded-lg px-3 py-1 text-sm font-semibold">
            Muito Difícil
          </div>
        );
      default:
        return null;
    }
  };

  const getTipoLabel = (questao: QuestaoBase) => {
    switch (questao.tipo) {
      case "objetiva":
        return "Múltipla escolha";
      case "discursiva":
        return "Discursiva";
      case "resposta_numerica":
        return "Resposta numérica";
      case "certo_errado":
        return "Certo ou errado";
      default:
        return "Questão";
    }
  };

  const renderActiveTabContent = (questao: QuestaoBase) => {
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

  const renderBotaoResponder = ({
    questaoId,
    disabled,
    onClick,
    label = "Responder",
  }: {
    questaoId: number;
    disabled: boolean;
    onClick: () => void;
    label?: string;
  }) => {
    return (
      <div className="flex justify-end mt-4">
        <button
          onClick={onClick}
          disabled={disabled || isSaving[questaoId] || tempoEncerrado}
          className="cursor-pointer px-6 sm:px-8 py-2 sm:py-3 bg-[#0E00D0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-sm sm:text-base font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {isSaving[questaoId] ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
              Salvando...
            </span>
          ) : (
            label
          )}
        </button>
      </div>
    );
  };

  const renderObjetiva = (questao: QuestaoBase) => {
    const respostaSalva = respostasSalvas[questao.id];

    const respostasBloqueadas = tempoEncerrado || simuladoFinalizado;
    const simuladoEmAndamento = isSimuladoOuProva && !simuladoFinalizado;

    /**
     * Pode ser:
     * - alternativa marcada pelo aluno agora
     * - alternativa salva do backend
     * - null, caso tenha ficado em branco
     */
    const alternativaSelecionada =
      selectedAnswers[questao.id] ??
      (respostaSalva?.tipo === "objetiva"
        ? respostaSalva.alternativa_id
        : null);

    /**
     * Simulado em andamento:
     * - nunca mostra verde/vermelho
     *
     * Simulado finalizado:
     * - se correta true => mostra correta
     * - se correta false => mostra incorreta
     * - se alternativaSelecionada null e correta false:
     *   QuizOption vai mostrar só a correta em verde.
     */
    const statusResposta: "unanswered" | "correct" | "incorrect" =
      simuladoEmAndamento
        ? "unanswered"
        : respostaSalva?.correta === true
          ? "correct"
          : respostaSalva?.correta === false
            ? "incorrect"
            : isQuestionAnswered(questao.id)
              ? alternativaSelecionada === questao.alternativa_correta_id
                ? "correct"
                : "incorrect"
              : "unanswered";

    const deixouEmBranco =
      simuladoFinalizado &&
      respostaSalva?.tipo === "objetiva" &&
      respostaSalva.alternativa_id == null;

    return (
      <>
        <div className="relative">
          {(questao.alternativas ?? []).map((alt) => {
            const altComProcessado = {
              ...alt,
              processedText: processedContent[questao.id]?.alternativas[alt.id],
            };

            return (
              <QuizOption
                key={alt.id}
                alternativa={altComProcessado}
                questaoId={questao.id}
                alternativaCorretaId={questao.alternativa_correta_id}
                selecaoAtual={alternativaSelecionada}
                statusResposta={statusResposta}
                stats={getStatsDaAlternativa(questao.id, alt.id)}
                showStats={
                  podeMostrarEstatisticasNasAlternativas &&
                  isQuestionAnswered(questao.id)
                }
                onSelect={(alternativaId) => {
                  if (respostasBloqueadas) {
                    return;
                  }

                  handleSelectAnswer(questao.id, alternativaId);
                }}
              />
            );
          })}
        </div>

        {deixouEmBranco && (
          <div className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200">
            Questão deixada em branco. Marcada como errada.
          </div>
        )}

        {renderBotaoResponder({
          questaoId: questao.id,
          onClick: () => {
            if (respostasBloqueadas) {
              alert("Esta tentativa já foi finalizada.");
              return;
            }

            handleConfirmObjetiva(questao.id, questao.alternativa_correta_id);
          },
          disabled:
            respostasBloqueadas ||
            isQuestionAnswered(questao.id) ||
            selectedAnswers[questao.id] == null,
        })}
      </>
    );
  };

  const renderRespostaNumerica = (questao: QuestaoBase) => {
    const answered = isQuestionAnswered(questao.id);
    const feedbackStatus = getQuestionFeedbackStatus(questao);

    const inputClass =
      answered && deveMostrarCorrecao
        ? feedbackStatus === "correct"
          ? "border-green-500 bg-green-50 dark:bg-green-950/40"
          : feedbackStatus === "incorrect"
            ? "border-red-500 bg-red-50 dark:bg-red-950/40"
            : "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#020617]";

    return (
      <div className="space-y-4">
        <input
          type="text"
          inputMode="decimal"
          value={numericAnswers[questao.id] ?? ""}
          disabled={answered}
          onChange={(e) =>
            setNumericAnswers((prev) => ({
              ...prev,
              [questao.id]: e.target.value,
            }))
          }
          placeholder="Digite sua resposta numérica"
          className={`w-full rounded-lg border px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-80 ${inputClass}`}
        />

        {answered && deveMostrarCorrecao && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
              feedbackStatus === "correct"
                ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/40 dark:bg-green-950/30 dark:text-green-200"
                : feedbackStatus === "incorrect"
                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200"
                  : "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-200"
            }`}
          >
            {feedbackStatus === "correct"
              ? "Resposta correta."
              : feedbackStatus === "incorrect"
                ? "Resposta incorreta. Confira o gabarito abaixo."
                : "Resposta registrada. Confira o gabarito abaixo."}
          </div>
        )}

        {renderBotaoResponder({
          questaoId: questao.id,
          onClick: () => handleConfirmRespostaNumerica(questao),
          disabled: answered || !numericAnswers[questao.id]?.trim(),
        })}
      </div>
    );
  };

  const renderCertoErrado = (questao: QuestaoBase) => {
    const selected = certoErradoAnswers[questao.id];
    const answered = isQuestionAnswered(questao.id);
    const expected = questao.gabarito_certo_errado;
    const feedbackStatus = getQuestionFeedbackStatus(questao);

    const optionClass = (value: GabaritoCertoErrado) => {
      if (answered && deveMostrarCorrecao) {
        if (expected && value === expected) {
          return "border-green-500 bg-green-100 dark:bg-green-900 text-green-900 dark:text-white";
        }

        if (selected === value && expected && value !== expected) {
          return "border-red-500 bg-red-100 dark:bg-red-900 text-red-900 dark:text-white";
        }

        return "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#020617] text-gray-500 dark:text-gray-500 opacity-70";
      }

      if (selected !== value) {
        return "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#020617] text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-950";
      }

      return "border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-white";
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["certo", "errado"] as GabaritoCertoErrado[]).map((value) => (
            <button
              key={value}
              disabled={answered}
              onClick={() =>
                setCertoErradoAnswers((prev) => ({
                  ...prev,
                  [questao.id]: value,
                }))
              }
              className={`rounded-lg border-2 px-4 py-4 font-bold uppercase transition-all disabled:cursor-not-allowed disabled:opacity-90 ${optionClass(
                value,
              )}`}
            >
              {value === "certo" ? "Certo" : "Errado"}
            </button>
          ))}
        </div>

        {answered && deveMostrarCorrecao && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
              feedbackStatus === "correct"
                ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/40 dark:bg-green-950/30 dark:text-green-200"
                : feedbackStatus === "incorrect"
                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200"
                  : "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-200"
            }`}
          >
            {feedbackStatus === "correct"
              ? "Resposta correta."
              : feedbackStatus === "incorrect"
                ? "Resposta incorreta. Confira o gabarito abaixo."
                : "Resposta registrada. Confira o gabarito abaixo."}
          </div>
        )}

        {renderBotaoResponder({
          questaoId: questao.id,
          onClick: () => handleConfirmCertoErrado(questao),
          disabled: answered || !certoErradoAnswers[questao.id],
        })}
      </div>
    );
  };

  const renderDiscursiva = (questao: QuestaoBase) => {
    const revealed = discursiveRevealed[questao.id];
    const answered = isQuestionAnswered(questao.id);

    return (
      <div className="space-y-4">
        <textarea
          value={discursiveAnswers[questao.id] ?? ""}
          disabled={answered || revealed}
          onChange={(e) =>
            setDiscursiveAnswers((prev) => ({
              ...prev,
              [questao.id]: e.target.value,
            }))
          }
          placeholder="Digite sua resposta..."
          className="min-h-[160px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#020617] px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-60"
        />

        {!revealed &&
          !answered &&
          renderBotaoResponder({
            questaoId: questao.id,
            onClick: () => handleRevealDiscursiva(questao.id),
            disabled: !discursiveAnswers[questao.id]?.trim(),
          })}

        {(revealed || answered) && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#020617] p-4 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2">
                Sua resposta
              </h4>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {discursiveAnswers[questao.id]}
              </p>
            </div>

            {questao.resposta_esperada && (
              <div>
                <h4 className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">
                  Resposta esperada
                </h4>
                <div
                  className="text-gray-800 dark:text-gray-200 markdown-body wmde-markdown wmde-markdown-color"
                  style={
                    {
                      "--color-canvas-default": "transparent",
                      "--color-fg-default": "currentColor",
                    } as React.CSSProperties
                  }
                  dangerouslySetInnerHTML={{
                    __html:
                      processedContent[questao.id]?.respostaEsperada ||
                      questao.resposta_esperada,
                  }}
                />
              </div>
            )}

            {questao.criterio_correcao && (
              <div>
                <h4 className="text-sm font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                  Critério de correção
                </h4>
                <div
                  className="text-gray-800 dark:text-gray-200 markdown-body wmde-markdown wmde-markdown-color"
                  style={
                    {
                      "--color-canvas-default": "transparent",
                      "--color-fg-default": "currentColor",
                    } as React.CSSProperties
                  }
                  dangerouslySetInnerHTML={{
                    __html:
                      processedContent[questao.id]?.criterioCorrecao ||
                      questao.criterio_correcao,
                  }}
                />
              </div>
            )}

            {!answered && (
              <div className="pt-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 font-semibold">
                  Você acertou?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAutoAvaliarDiscursiva(questao, true)}
                    disabled={isSaving[questao.id]}
                    className="rounded-lg border-2 border-green-500 bg-green-100 dark:bg-green-900 px-4 py-3 text-green-900 dark:text-white font-bold hover:bg-green-200 dark:hover:bg-green-800 transition disabled:opacity-60"
                  >
                    Acertei
                  </button>

                  <button
                    onClick={() => handleAutoAvaliarDiscursiva(questao, false)}
                    disabled={isSaving[questao.id]}
                    className="rounded-lg border-2 border-red-500 bg-red-100 dark:bg-red-900 px-4 py-3 text-red-900 dark:text-white font-bold hover:bg-red-200 dark:hover:bg-red-800 transition disabled:opacity-60"
                  >
                    Errei
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderQuestionAnswerArea = (questao: QuestaoBase) => {
    switch (questao.tipo) {
      case "objetiva":
        return renderObjetiva(questao);

      case "discursiva":
        return renderDiscursiva(questao);

      case "resposta_numerica":
        return renderRespostaNumerica(questao);

      case "certo_errado":
        return renderCertoErrado(questao);

      default:
        return (
          <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-200">
            Tipo de questão não suportado.
          </div>
        );
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${className}`}>
      <div className="flex-1 overflow-y-auto">
        {isProcessingContent ? (
          <MultipleQuestionSkeleton count={questions.length} />
        ) : (
          <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 pt-2 lg:pt-6">
            <main>
              {simuladoFinalizado && (
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-slate-950 shadow-xl dark:border-blue-800 dark:bg-blue-950/40 dark:text-white">
                  <h2 className="text-xl font-black">Simulado finalizado</h2>

                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-100">
                    Agora você pode revisar suas respostas. As questões corretas
                    e incorretas aparecem marcadas na navegação e nos cartões.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20">
                      <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">
                        Questões
                      </div>
                      <div className="mt-1 text-2xl font-black">
                        {questions.length}
                      </div>
                    </div>

                    <div className="rounded-xl border border-green-300 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-950/30">
                      <div className="text-xs uppercase tracking-widest text-green-700 dark:text-green-300">
                        Corretas
                      </div>
                      <div className="mt-1 text-2xl font-black text-green-700 dark:text-green-300">
                        {
                          Object.values(respostasSalvas).filter(
                            (resposta: any) => resposta?.correta === true,
                          ).length
                        }
                      </div>
                    </div>

                    <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-950/30">
                      <div className="text-xs uppercase tracking-widest text-red-700 dark:text-red-300">
                        Incorretas
                      </div>
                      <div className="mt-1 text-2xl font-black text-red-700 dark:text-red-300">
                        {
                          Object.values(respostasSalvas).filter(
                            (resposta: any) => resposta?.correta === false,
                          ).length
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {questions.map((questao, index) => (
                <QuestionWrapper key={questao.id} questionId={questao.id}>
                  <div className="bg-white dark:bg-[#00091A] rounded-lg shadow-lg mb-4 sm:mb-5 border border-gray-200 dark:border-[#616161]">
                    <div className="w-full bg-blue-50 dark:bg-blue-950 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-gray-100 dark:bg-gray-800 overflow-hidden w-full">
                        <div className="bg-gradient-to-br from-[#1F293C] to-[#2D3748] text-white px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-300 dark:text-gray-400 font-medium">
                              QUESTÃO
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-white">
                              {index + 1}
                            </span>
                          </div>

                          <div className="h-8 w-px bg-gray-600" />

                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-300 dark:text-gray-400 font-medium">
                              ID
                            </span>
                            <span className="text-base sm:text-lg font-semibold text-blue-300">
                              #{questao.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex-grow rounded-bl-md sm:rounded-bl-none sm:rounded-l-md relative bg-white dark:bg-[#020617] text-gray-800 dark:text-gray-100 px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-between">
                          <div className="text-sm sm:text-base font-medium">
                            <button
                              onClick={() => toggleTopics(questao.id)}
                              className="cursor-pointer text-blue-800 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200 flex items-center gap-1 sm:gap-2"
                            >
                              {topicsVisible[questao.id] ? (
                                <>
                                  Ocultar tópicos{" "}
                                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                </>
                              ) : (
                                <>
                                  Ver tópicos{" "}
                                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                </>
                              )}
                            </button>

                            <AnimatePresence>
                              {topicsVisible[questao.id] && questao.topicos && (
                                <motion.div
                                  initial={{ x: 100, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  exit={{ x: 100, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="absolute top-0 right-0 h-full bg-blue-900 text-white text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3 flex items-center gap-1 sm:gap-2 rounded-l-xl shadow-lg z-20"
                                >
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                    {questao.topicos.map((t) => (
                                      <span
                                        key={t.id}
                                        className="bg-blue-700 text-white text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full whitespace-nowrap shadow-md"
                                      >
                                        {t.nome}
                                      </span>
                                    ))}

                                    <div className="ml-1 sm:ml-3">
                                      {getDifficultyBadge(questao.dificuldade)}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-sm font-medium my-2 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {/* <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
                          {getTipoLabel(questao)}
                        </span> */}

                        {questao.prova?.sigla ? (
                          <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {questao.prova.sigla}
                          </span>
                        ) : null}

                        {questao.prova?.ano ? (
                          <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {questao.prova.ano}
                          </span>
                        ) : null}

                        {!!questao.adaptado && (
                          <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            Questão Adaptada
                          </span>
                        )}
                      </div>

                      <div className="mt-1 sm:mt-0">
                        <OpcoesQuestao
                          questao={questao}
                          onReport={() => openReportModal(questao.id)}
                        />
                      </div>
                    </div>

                    <section className="p-4 sm:p-6 relative">
                      <div
                        className="text-gray-800 dark:text-gray-200 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base markdown-body wmde-markdown wmde-markdown-color"
                        style={
                          {
                            "--color-canvas-default": "transparent",
                            "--color-fg-default": "currentColor",
                            fontSize: "0.875rem",
                            lineHeight: "1.25rem",
                          } as React.CSSProperties
                        }
                        dangerouslySetInnerHTML={{
                          __html:
                            processedContent[questao.id]?.enunciado ||
                            questao.enunciado,
                        }}
                      />

                      <AnimatePresence>
                        {showFeedback[questao.id] &&
                          !isSimuladoOuProva &&
                          answeredQuestions[questao.id] &&
                          (() => {
                            const feedback = getQuestionFeedbackText(questao);

                            return (
                              <AnswerFeedbackOverlay
                                show={showFeedback[questao.id]}
                                status={feedback.status}
                                title={feedback.title}
                                subtitle={feedback.subtitle}
                              />
                            );
                          })()}
                      </AnimatePresence>

                      {renderQuestionAnswerArea(questao)}
                    </section>

                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-b-lg">
                      <div className="w-full rounded-lg overflow-hidden flex flex-row flex-wrap justify-around items-center py-3 sm:py-4">
                        <button
                          onClick={() => toggleTab(questao.id, "gabarito")}
                          disabled={
                            !simuladoFinalizado &&
                            !isQuestionAnswered(questao.id)
                          }
                          className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 sm:p-3 transition duration-200 ease-in-out flex-1 min-w-[120px] text-center space-x-1 sm:space-x-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                            activeTabs[questao.id] === "gabarito"
                              ? "text-white bg-blue-900"
                              : "text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-white"
                          }`}
                        >
                          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs sm:text-sm md:text-base">
                            Gabarito
                          </span>
                          {getTabIcon(questao.id, "gabarito")}
                        </button>

                        <button
                          onClick={() => toggleTab(questao.id, "estatisticas")}
                          disabled={
                            !simuladoFinalizado &&
                            !isQuestionAnswered(questao.id)
                          }
                          className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 sm:p-3 transition duration-200 ease-in-out flex-1 min-w-[120px] text-center border-l border-gray-200 dark:border-gray-700 space-x-1 sm:space-x-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                            activeTabs[questao.id] === "estatisticas"
                              ? "text-white bg-blue-900"
                              : "text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-white"
                          }`}
                        >
                          <ChartColumn className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs sm:text-sm md:text-base">
                            Estatísticas
                          </span>
                          {getTabIcon(questao.id, "estatisticas")}
                        </button>

                        <button
                          onClick={() => toggleTab(questao.id, "duvida")}
                          disabled={
                            !simuladoFinalizado &&
                            !isQuestionAnswered(questao.id)
                          }
                          className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 sm:p-3 transition duration-200 ease-in-out flex-1 min-w-[120px] text-center border-l border-gray-200 dark:border-gray-700 space-x-1 sm:space-x-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                            activeTabs[questao.id] === "duvida"
                              ? "text-white bg-blue-900"
                              : "text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-white"
                          }`}
                        >
                          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs sm:text-sm md:text-base">
                            Dúvida
                          </span>
                          {getTabIcon(questao.id, "duvida")}
                        </button>
                      </div>

                      <AnimatePresence>
                        {activeTabs[questao.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                              duration: 0.3,
                              ease: "easeInOut",
                            }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                              {renderActiveTabContent(questao)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {openReportModalId && (
                        <ReportarModal
                          questaoId={openReportModalId}
                          onClose={closeReportModal}
                          token={userToken || ""}
                        />
                      )}
                    </div>
                  </div>
                </QuestionWrapper>
              ))}
            </main>
          </div>
        )}
      </div>

      {deveMostrarBotaoRefazer && (
        <RefazerListaButton
          onRefazerLista={handleRefazerLista}
          isLoading={isRefazendoLista}
          isTentativaFinalizada={tentativaFinalizada}
        />
      )}

      {zoomedImageUrl && (
        <ImageLightbox imageUrl={zoomedImageUrl} onClose={closeLightbox} />
      )}
    </div>
  );
};

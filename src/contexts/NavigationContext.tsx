// contexts/NavigationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

import type {
  QuestaoBase,
  RespostaQuestao,
  RespostasPorQuestao,
} from "@/types/questions";

export type NavigationQuestion = QuestaoBase;

export type QuestionStatus =
  | "unanswered"
  | "correct"
  | "incorrect"
  | "viewing"
  | "answered";

export interface QuestaoNavigation {
  id: number;
  status: QuestionStatus;
  numero: number;
  isHovered?: boolean;
  isViewing?: boolean;
}

export interface NavigationContextType {
  questions: QuestaoNavigation[];
  currentQuestionId: number | null;

  updateQuestionStatus: (
    questionId: number,
    status: "correct" | "incorrect" | "answered",
  ) => void;

  setCurrentQuestion: (questionId: number) => void;
  setQuestionHover: (questionId: number, isHovered: boolean) => void;
  scrollToQuestion: (questionId: number) => void;

  todasQuestoesRespondidas: boolean;

  progresso: {
    respondidas: number;
    total: number;
    percentual: number;
  };
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export const useNavigation = () => {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }

  return context;
};

/**
 * Compatibilidade temporária:
 *
 * Modelo antigo:
 * {
 *   [questaoId]: alternativaId
 * }
 *
 * Modelo novo:
 * {
 *   [questaoId]: RespostaQuestao
 * }
 */
type RespostasSalvasCompat =
  | Record<number, number>
  | RespostasPorQuestao
  | undefined;

interface NavigationProviderProps {
  children: React.ReactNode;
  questions: NavigationQuestion[];
  respostasSalvas?: RespostasSalvasCompat;
  isSimuladoOuProva?: boolean;
}

function isRespostaQuestao(value: unknown): value is RespostaQuestao {
  return (
    typeof value === "object" &&
    value !== null &&
    "tipo" in value &&
    "questao_id" in value
  );
}

function getRespostaSalva(
  respostas: RespostasSalvasCompat,
  questaoId: number,
): number | RespostaQuestao | null {
  if (!respostas) return null;

  const resposta = respostas[questaoId];

  if (!resposta) return null;

  return resposta;
}

/**
 * Define se uma questão realmente conta como respondida.
 *
 * Regra importante:
 * discursiva só conta como respondida depois que o aluno
 * marcar "Acertei" ou "Errei".
 */
function questaoFoiRespondida(
  respostas: RespostasSalvasCompat,
  questaoId: number,
): boolean {
  const resposta = getRespostaSalva(respostas, questaoId);

  if (!resposta) return false;

  /**
   * Modelo antigo:
   * questao_id -> alternativa_id
   */
  if (typeof resposta === "number") {
    return true;
  }

  if (!isRespostaQuestao(resposta)) {
    return false;
  }

  switch (resposta.tipo) {
    case "objetiva":
      return !!resposta.alternativa_id;

    case "discursiva":
      return typeof resposta.correta === "boolean";

    case "resposta_numerica":
      return !!resposta.resposta_numerica?.trim();

    case "certo_errado":
      return (
        resposta.resposta_certo_errado === "certo" ||
        resposta.resposta_certo_errado === "errado"
      );

    default:
      return false;
  }
}

function normalizeNumericAnswer(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(",", ".")
    .replace(/\s+/g, "");
}

function getStatusFromNovaResposta(
  questaoData: NavigationQuestion,
  resposta: RespostaQuestao,
  isSimuladoOuProva: boolean,
): QuestionStatus {
  /**
   * Em simulados/provas:
   * - durante a resolução: foi_correta/correta vem null -> mostra apenas "answered"
   * - depois da finalização: correta vem true/false -> mostra correct/incorrect
   */
  if (isSimuladoOuProva) {
    if (resposta.correta === true) {
      return "correct";
    }

    if (resposta.correta === false) {
      return "incorrect";
    }

    return "answered";
  }

  switch (resposta.tipo) {
    case "objetiva": {
      if (!resposta.alternativa_id) {
        return "unanswered";
      }

      /**
       * Se a resposta já veio corrigida do backend,
       * usamos ela como fonte principal.
       */
      if (resposta.correta === true) {
        return "correct";
      }

      if (resposta.correta === false) {
        return "incorrect";
      }

      const isCorrect =
        resposta.alternativa_id === questaoData.alternativa_correta_id;

      return isCorrect ? "correct" : "incorrect";
    }

    case "discursiva": {
      /**
       * A discursiva só chega aqui como respondida quando o aluno
       * marcou "Acertei" ou "Errei".
       */
      if (resposta.correta === true) {
        return "correct";
      }

      if (resposta.correta === false) {
        return "incorrect";
      }

      return "unanswered";
    }

    case "resposta_numerica": {
      if (!resposta.resposta_numerica?.trim()) {
        return "unanswered";
      }

      /**
       * Se a resposta já veio corrigida do backend,
       * usamos ela como fonte principal.
       */
      if (resposta.correta === true) {
        return "correct";
      }

      if (resposta.correta === false) {
        return "incorrect";
      }

      /**
       * Se ainda não houver gabarito numérico cadastrado,
       * marca apenas como respondida.
       */
      if (!questaoData.resposta_numerica?.trim()) {
        return "answered";
      }

      const respostaAluno = normalizeNumericAnswer(resposta.resposta_numerica);
      const respostaCorreta = normalizeNumericAnswer(
        questaoData.resposta_numerica,
      );

      return respostaAluno === respostaCorreta ? "correct" : "incorrect";
    }

    case "certo_errado": {
      if (
        resposta.resposta_certo_errado !== "certo" &&
        resposta.resposta_certo_errado !== "errado"
      ) {
        return "unanswered";
      }

      /**
       * Se a resposta já veio corrigida do backend,
       * usamos ela como fonte principal.
       */
      if (resposta.correta === true) {
        return "correct";
      }

      if (resposta.correta === false) {
        return "incorrect";
      }

      if (!questaoData.gabarito_certo_errado) {
        return "answered";
      }

      const isCorrect =
        resposta.resposta_certo_errado === questaoData.gabarito_certo_errado;

      return isCorrect ? "correct" : "incorrect";
    }

    default:
      return "answered";
  }
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  questions: initialQuestions,
  respostasSalvas,
  isSimuladoOuProva = false,
}) => {
  const [questionsNavigation, setQuestionsNavigation] = useState<
    QuestaoNavigation[]
  >([]);

  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(
    null,
  );

  const initializedRef = useRef(false);

  const progresso = useMemo(() => {
    const respondidas = questionsNavigation.filter(
      (q) =>
        q.status === "correct" ||
        q.status === "incorrect" ||
        q.status === "answered",
    ).length;

    const total = questionsNavigation.length;

    return {
      respondidas,
      total,
      percentual: total > 0 ? Math.round((respondidas / total) * 100) : 0,
    };
  }, [questionsNavigation]);

  const todasQuestoesRespondidas = useMemo(() => {
    return progresso.total > 0 && progresso.respondidas >= progresso.total;
  }, [progresso]);

  const getQuestionStatus = useCallback(
    (
      questaoId: number,
      questaoData: NavigationQuestion,
      respostas: RespostasSalvasCompat,
    ): QuestionStatus => {
      const resposta = getRespostaSalva(respostas, questaoId);

      if (!resposta) {
        return "unanswered";
      }

      /**
       * Modelo antigo:
       * questao_id -> alternativa_id
       */
      if (typeof resposta === "number") {
        if (isSimuladoOuProva) {
          return "answered";
        }

        const isCorrect = resposta === questaoData.alternativa_correta_id;

        return isCorrect ? "correct" : "incorrect";
      }

      /**
       * Modelo novo:
       * questao_id -> RespostaQuestao
       */
      if (isRespostaQuestao(resposta)) {
        if (!questaoFoiRespondida(respostas, questaoId)) {
          return "unanswered";
        }

        return getStatusFromNovaResposta(
          questaoData,
          resposta,
          isSimuladoOuProva,
        );
      }

      return "unanswered";
    },
    [isSimuladoOuProva],
  );

  useEffect(() => {
    if (initialQuestions.length === 0) return;

    const initialNavigation: QuestaoNavigation[] = initialQuestions.map(
      (questao, index) => {
        const status = getQuestionStatus(questao.id, questao, respostasSalvas);

        return {
          id: questao.id,
          status,
          numero: index + 1,
          isHovered: false,
          isViewing: index === 0 && !initializedRef.current,
        };
      },
    );

    setQuestionsNavigation(initialNavigation);

    if (initialQuestions.length > 0 && !initializedRef.current) {
      setCurrentQuestionId(initialQuestions[0].id);
    }

    initializedRef.current = true;
  }, [initialQuestions, respostasSalvas, getQuestionStatus]);

  const updateQuestionStatus = useCallback(
    (questionId: number, status: "correct" | "incorrect" | "answered") => {
      let finalStatus: "correct" | "incorrect" | "answered" = status;

      /**
       * Em simulados/provas, não exibimos certo/errado durante a resolução.
       */
      if (
        isSimuladoOuProva &&
        (status === "correct" || status === "incorrect")
      ) {
        finalStatus = "answered";
      }

      setQuestionsNavigation((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, status: finalStatus } : q,
        ),
      );
    },
    [isSimuladoOuProva],
  );

  const setCurrentQuestion = useCallback((questionId: number) => {
    setCurrentQuestionId(questionId);

    setQuestionsNavigation((prev) =>
      prev.map((q) => ({
        ...q,
        isViewing: q.id === questionId,
      })),
    );
  }, []);

  const setQuestionHover = useCallback(
    (questionId: number, isHovered: boolean) => {
      setQuestionsNavigation((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, isHovered } : q)),
      );
    },
    [],
  );

  const scrollToQuestion = useCallback(
    (questionId: number) => {
      setTimeout(() => {
        const element = document.getElementById(`question-${questionId}`);

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });

          setCurrentQuestion(questionId);
        }
      }, 100);
    },
    [setCurrentQuestion],
  );

  const value: NavigationContextType = {
    questions: questionsNavigation,
    currentQuestionId,
    updateQuestionStatus,
    setCurrentQuestion,
    setQuestionHover,
    scrollToQuestion,
    todasQuestoesRespondidas,
    progresso,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

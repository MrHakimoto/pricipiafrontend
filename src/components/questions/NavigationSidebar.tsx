"use client";

import { useNavigation } from "@/contexts/NavigationContext";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Mail,
  XCircle,
  Square,
  Flag,
  Circle,
  Tag,
  ChevronDown,
  ChevronUp,
  ScrollText,
  EllipsisVertical,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Assunto, Frente, TopicoCompleto } from "@/types/list";
import { useState, useEffect, useMemo } from "react";
import GeneratePdfButton from "./GeneratePdfButton";
import { useSession } from "next-auth/react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface NavigationSidebarProps {
  className?: string;
  listaInfo?: {
    id: number;
    nome?: string;
    name?: string;
    descricao?: string | null;
    total_time_in_seconds?: number;
    tipo?: string;
  };
  assuntos?: Assunto[];
  frentes?: Frente[];
  topicos?: TopicoCompleto[];
  onFinalizarTentativa?: () => void;
  podeFinalizarTentativa?: boolean;
  resolucaoId?: number | null;
  navbarHeight?: number;
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

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  className = "",
  listaInfo,
  assuntos = [],
  frentes = [],
  topicos = [],
  onFinalizarTentativa,
  resolucaoId,
  navbarHeight = 64,
  podeFinalizarTentativa = true,
}) => {
  const { questions, scrollToQuestion, setQuestionHover } = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const pathname = usePathname();
  const listaTitulo = listaInfo?.nome || listaInfo?.name || "Lista";

  const pdfContext = getPdfContextByPath(pathname, listaInfo?.tipo);

  const pdfPublicUrl = buildPublicPdfUrl(pathname);
  const { data: session, status } = useSession();

  const normalizedPath = pathname ? pathname.replace(/\/+$/, "") : "";

  useDocumentTitle(listaInfo?.nome ?? "Lista");

  // mostrar quando começa com /exercicios/listas-oficiais
  // mas NÃO mostrar quando começa com /modulos (ou contenha /modulos dependendo do caso)
  const mostrarVoltar =
    normalizedPath.startsWith("/exercicios/listas-oficiais") &&
    !normalizedPath.startsWith("/modulos");

  // Verificar se é mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  function getPublicAppBaseUrl() {
    return (
      process.env.NEXT_PUBLIC_APP_URL || "https://app.principiamatematica.com"
    ).replace(/\/+$/, "");
  }

  function buildPublicPdfUrl(pathname: string | null) {
    const baseUrl = getPublicAppBaseUrl();
    const safePathname = pathname || "";

    if (typeof window === "undefined") {
      return `${baseUrl}${safePathname}`;
    }

    const search = window.location.search || "";

    return `${baseUrl}${safePathname}${search}`;
  }

  function getPdfContextByPath(pathname: string | null, tipo?: string) {
    const path = pathname || "";
    const normalizedTipo = String(tipo || "")
      .toLowerCase()
      .trim();

    if (path.startsWith("/modulos")) {
      return {
        coverKind: "LISTA DE CURSO",
        subtitulo: "Lista vinculada ao módulo",
        courseTitle: "Principia Matemática",
      };
    }

    if (path.startsWith("/exercicios/listas-oficiais")) {
      return {
        coverKind: "LISTA OFICIAL",
        subtitulo: "Lista oficial de exercícios",
        courseTitle: "Principia Matemática",
      };
    }

    if (path.startsWith("/exercicios/provas-famosas")) {
      return {
        coverKind: "PROVA FAMOSA",
        subtitulo: "Lista gerada a partir de prova",
        courseTitle: "Principia Matemática",
      };
    }

    if (path.startsWith("/exercicios/minhas-listas")) {
      return {
        coverKind: "MINHA LISTA",
        subtitulo: "Lista pessoal de exercícios",
        courseTitle: "Principia Matemática",
      };
    }

    if (normalizedTipo === "oficial") {
      return {
        coverKind: "LISTA OFICIAL",
        subtitulo: "Lista oficial de exercícios",
        courseTitle: "Principia Matemática",
      };
    }

    if (normalizedTipo === "pessoal") {
      return {
        coverKind: "MINHA LISTA",
        subtitulo: "Lista pessoal de exercícios",
        courseTitle: "Principia Matemática",
      };
    }

    return {
      coverKind: "LISTA DE EXERCÍCIOS",
      subtitulo: "Lista de exercícios",
      courseTitle: "Principia Matemática",
    };
  }

  // ✅ Verificar se é simulado ou prova
  const isSimuladoOuProva =
    listaInfo?.tipo && ["simulado", "prova"].includes(listaInfo.tipo);
  const token = useMemo(() => getTokenFromSession(session), [session]);
  // Estatísticas - ✅ IMPORTANTE: Mantendo a lógica original
  const correctCount = questions.filter((q) => q.status === "correct").length;
  const incorrectCount = questions.filter(
    (q) => q.status === "incorrect",
  ).length;
  const answeredCount = questions.filter((q) => q.status === "answered").length;
  const unansweredCount = questions.filter(
    (q) => q.status === "unanswered",
  ).length;

  const getTagContent = () => {
    if (frentes && frentes.length > 0) {
      return {
        text: frentes[0].nome,
        color: "bg-purple-600",
        icon: <Tag size={12} className="inline mr-1" />,
      };
    }
  };

  const tag = getTagContent();

  // ✅ FUNÇÃO PARA CORES DAS QUESTÕES - MANTENDO A LÓGICA ORIGINAL
  const getStatusClasses = (question: any, isMobileStyle = false) => {
    const baseClasses = isMobileStyle
      ? "inline-flex items-center justify-center text-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2 hover:opacity-70 p-0.5 border rounded-sm relative shrink-0 font-bold w-8 h-8 my-2 "
      : "px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300 border-2 ";

    // ✅ MANTENDO A LÓGICA ORIGINAL DE PRIORIDADE

    // Primeiro verifica se está sendo visualizada (MAIOR PRIORIDADE)
    if (question.isViewing) {
      if (question.status === "correct") {
        return (
          baseClasses +
          (question.isHovered
            ? "bg-green-100 text-green-700 border-green-500 shadow-lg scale-110 dark:bg-green-800 dark:text-green-300 dark:border-white"
            : "bg-green-50 text-green-700 border-blue-500 shadow-lg shadow-blue-200/50 dark:bg-green-900 dark:text-green-400 dark:shadow-blue-500/50")
        );
      }
      if (question.status === "incorrect") {
        return (
          baseClasses +
          (question.isHovered
            ? "bg-red-100 text-red-700 border-red-500 shadow-lg scale-110 dark:bg-red-800 dark:text-red-300 dark:border-white"
            : "bg-red-50 text-red-700 border-blue-500 shadow-lg shadow-blue-200/50 dark:bg-red-900 dark:text-red-400 dark:shadow-blue-500/50")
        );
      }
      if (question.status === "answered") {
        return (
          baseClasses +
          (question.isHovered
            ? "bg-blue-100 text-blue-700 border-blue-500 shadow-lg scale-110 dark:bg-blue-800 dark:text-blue-300 dark:border-white"
            : "bg-blue-50 text-blue-700 border-blue-500 shadow-lg shadow-blue-200/50 dark:bg-blue-900 dark:text-blue-400 dark:shadow-blue-500/50")
        );
      }
      return (
        baseClasses +
        (question.isHovered
          ? "bg-blue-100 text-blue-700 border-blue-500 shadow-lg scale-110 dark:bg-blue-800 dark:text-blue-300 dark:border-white"
          : "bg-blue-50 text-blue-700 border-blue-500 shadow-lg shadow-blue-200/50 dark:bg-blue-900 dark:text-blue-400 dark:shadow-blue-500/50")
      );
    }

    // Depois verifica o status de correção/resposta
    if (question.status === "correct") {
      return (
        baseClasses +
        (question.isHovered
          ? "bg-green-100 text-green-700 border-green-500 shadow-lg scale-110 dark:bg-green-800 dark:text-green-300 dark:border-white"
          : "bg-green-50 text-green-700 border-green-500 shadow-lg shadow-green-200/50 dark:bg-green-900 dark:text-green-400 dark:border-green-600 dark:shadow-green-500/25")
      );
    }
    if (question.status === "incorrect") {
      return (
        baseClasses +
        (question.isHovered
          ? "bg-red-100 text-red-700 border-red-500 shadow-lg scale-110 dark:bg-red-800 dark:text-red-300 dark:border-white"
          : "bg-red-50 text-red-700 border-red-500 shadow-lg shadow-red-200/50 dark:bg-red-900 dark:text-red-400 dark:border-red-600 dark:shadow-red-500/25")
      );
    }
    if (question.status === "answered") {
      return (
        baseClasses +
        (question.isHovered
          ? "bg-blue-100 text-blue-700 border-blue-500 shadow-lg scale-110 dark:bg-blue-800 dark:text-blue-300 dark:border-white"
          : "bg-blue-50 text-blue-700 border-blue-500 shadow-lg shadow-blue-200/50 dark:bg-blue-900 dark:text-blue-400 dark:border-blue-600 dark:shadow-blue-500/25")
      );
    }

    // Por último verifica hover e estado normal
    if (question.isHovered) {
      return (
        baseClasses +
        "bg-slate-200 text-slate-900 border-slate-500 shadow-lg scale-110 dark:bg-gray-700 dark:text-white dark:border-white"
      );
    }

    return (
      baseClasses +
      "bg-white text-slate-600 border-slate-300 hover:bg-slate-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
    );
  };

  const handleMouseEnter = (questionId: number) => {
    setQuestionHover(questionId, true);
  };

  const handleMouseLeave = (questionId: number) => {
    setQuestionHover(questionId, false);
  };

  const handleQuestionClick = (questionId: number) => {
    console.log("Clicou na questão:", questionId);
    scrollToQuestion(questionId);
    if (isMobileView) {
      setIsMobileMenuOpen(false);
    }
  };

  // ✅ Para simulados/provas, contar "answered" como respondidas
  const totalRespondidas = isSimuladoOuProva
    ? answeredCount
    : correctCount + incorrectCount;

  const totalTime = listaInfo?.total_time_in_seconds || questions.length * 3;

  const getDifficultyText = () => {
    if (listaInfo?.tipo === "simulado") return "Simulado";
    if (listaInfo?.tipo === "prova") return "Prova";
    return "Médio";
  };

  const canShowPdfButton = !isSimuladoOuProva && Boolean(listaInfo);
  const safeListaInfo = listaInfo ?? null;

  // Conteúdo da barra de questões mobile (com estilos originais)
  const questionsBarMobile = (
    <div className="flex w-full overflow-x-auto self-center px-3 gap-1.5 max-h-[200px] transition-[max-height] custom-scrollbar">
      {questions.map((question) => (
        <button
          key={question.id}
          type="button"
          onMouseEnter={() => handleMouseEnter(question.id)}
          onMouseLeave={() => handleMouseLeave(question.id)}
          onClick={() => handleQuestionClick(question.id)}
          className={getStatusClasses(question, true)}
          id={`go-to-${question.id}`}
          aria-selected={question.isViewing}
        >
          {question.numero}
        </button>
      ))}
    </div>
  );

  // Conteúdo principal da sidebar (desktop)
  const desktopSidebar = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 p-5 overflow-y-auto"
    >
      {/* Voltar */}
      {mostrarVoltar && (
        <Link
          href="/listas-oficiais"
          className="inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground size-6 p-0.5 text-xs rounded-sm self-start"
          aria-label="Voltar"
          title="Voltar"
        >
          <ArrowLeft size={14} />
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 mb-4">
        {/* <div className="flex items-center gap-2 text-sm text-gray-400">
          <FileText className="text-blue-500" size={16} />
          <span>Minhas Listas</span>
        </div> */}

        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          {listaInfo?.nome || "Minha lista fofinha :)"}
        </h2>

        {isSimuladoOuProva && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onFinalizarTentativa}
            disabled={!podeFinalizarTentativa}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-all duration-300 ${
              resolucaoId
                ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                : "bg-slate-200 cursor-not-allowed text-slate-500 dark:bg-gray-600 dark:text-gray-400"
            }`}
          >
            <Flag size={16} />
            Finalizar {listaInfo?.tipo === "simulado" ? "Simulado" : "Prova"}
            {!resolucaoId && (
              <span className="text-xs ml-1">(Não iniciada)</span>
            )}
          </motion.button>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 mt-1">
          <div className="flex items-center gap-1">
            <Clock size={14} /> <span>≈ {totalTime} min</span>
          </div>
          <span className="bg-slate-200 px-2 py-0.5 rounded-full text-slate-700 dark:bg-gray-700 dark:text-gray-300">
            {getDifficultyText()}
          </span>
        </div>
      </div>

      {/* Tag */}
      {tag && (
        <div className="mb-4">
          <span
            className={`${tag.color} text-white text-xs font-medium px-3 py-1 rounded-lg inline-flex items-center`}
          >
            {tag.icon}
            {tag.text}
          </span>
        </div>
      )}

      {/* ✅ Estatísticas ATUALIZADAS - MANTENDO A LÓGICA ORIGINAL */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        {isSimuladoOuProva ? (
          // ✅ Para simulados/provas: mostramos apenas "respondidas" e "não respondidas"
          <>
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Circle size={14} /> {answeredCount}
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
              <Square size={14} /> {unansweredCount}
            </div>
          </>
        ) : (
          // ✅ Para listas normais: mostramos correto/incorreto/não respondido
          <>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Mail size={14} /> {correctCount}
            </div>
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <XCircle size={14} /> {incorrectCount}
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
              <Square size={14} /> {unansweredCount}
            </div>
          </>
        )}
      </div>

      {/* ✅ Barras de progresso ATUALIZADAS - MANTENDO A LÓGICA ORIGINAL */}
      <div className="flex gap-1 mb-4">
        {isSimuladoOuProva ? (
          // ✅ Para simulados/provas: apenas azul (respondidas) e cinza (não respondidas)
          <>
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            ></div>
            <div
              className="h-2 rounded-full bg-slate-300 transition-all duration-500 ease-out dark:bg-gray-600"
              style={{
                width: `${(unansweredCount / questions.length) * 100}%`,
              }}
            ></div>
          </>
        ) : (
          // ✅ Para listas normais: verde/vermelho/cinza
          <>
            <div
              className="h-2 rounded-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${(correctCount / questions.length) * 100}%` }}
            ></div>
            <div
              className="h-2 rounded-full bg-red-500 transition-all duration-500 ease-out"
              style={{ width: `${(incorrectCount / questions.length) * 100}%` }}
            ></div>
            <div
              className="h-2 rounded-full bg-slate-300 transition-all duration-500 ease-out dark:bg-gray-600"
              style={{
                width: `${(unansweredCount / questions.length) * 100}%`,
              }}
            ></div>
          </>
        )}
      </div>

      {/* Números das Questões - Grid no desktop */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {questions.map((question) => (
          <motion.button
            key={question.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => handleMouseEnter(question.id)}
            onMouseLeave={() => handleMouseLeave(question.id)}
            onClick={() => handleQuestionClick(question.id)}
            className={getStatusClasses(question, false)}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          >
            {question.numero}
          </motion.button>
        ))}
      </div>

      {/* Botão PDF */}

      {canShowPdfButton && safeListaInfo && (
        <GeneratePdfButton
          listaId={safeListaInfo.id}
          token={token}
          tituloLista={listaTitulo}
          subtituloLista={safeListaInfo.descricao || pdfContext.subtitulo}
          courseTitle={pdfContext.courseTitle}
          coverKind={pdfContext.coverKind}
          publicUrl={pdfPublicUrl}
        />
      )}
      {/* Status da Tentativa */}
      {/* <div className="mt-3 text-center">
        <span className={`text-xs font-medium ${resolucaoId ? 'text-green-400' : 'text-yellow-400'}`}>
          {resolucaoId
            ? `✓ Tentativa #${resolucaoId} ativa`
            : '⚠ Aguardando início da tentativa'
          }
          {isSimuladoOuProva && ` (${listaInfo?.tipo})`}
        </span>
      </div> */}

      {/* DEBUG - Apenas em desenvolvimento */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-2 bg-slate-100 rounded text-xs text-slate-500 dark:bg-black/50 dark:text-gray-400">
          <div>DEBUG:</div>
          <div>Resolução ID: {resolucaoId || "null"}</div>
          <div>Questões: {questions.length}</div>
          <div>Respondidas: {totalRespondidas}</div>
          <div>Tipo: {listaInfo?.tipo || "normal"}</div>
          <div>É simulado/prova: {isSimuladoOuProva ? "Sim" : "Não"}</div>
          <div>Corretas: {correctCount}</div>
          <div>Incorretas: {incorrectCount}</div>
          <div>Respondidas (neutro): {answeredCount}</div>
        </div>
      )}
    </motion.div>
  );

  // Mobile header (barra superior fixa)
  const mobileHeader = (
    <div className="flex items-center gap-3 px-2.5 sm:px-4 py-2.5 bg-[#F8F8F8] border-b border-slate-200 dark:bg-[#00091A] dark:border-gray-800">
      {mostrarVoltar && (
        <Link
          href="/listas-oficiais"
          className="inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground size-6 p-0.5 text-xs rounded-sm self-start"
          aria-label="Voltar"
          title="Voltar"
        >
          <ArrowLeft size={14} />
        </Link>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[12px] leading-[12px] flex flex-row items-center gap-1 text-slate-500 dark:text-gray-400">
          <ScrollText size={12} className="mr-1" />
          Lista de exercícios
        </span>
        <h5 className="font-semibold text-base truncate text-slate-950 dark:text-white">
          {listaInfo?.nome || "Minha lista"}
        </h5>
      </div>

      <div className="flex flex-row gap-1.5">
        {/* <button
          className="inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 size-8 p-1 text-xs"
          aria-label="Ver informações"
          title="Ver informações"
          aria-haspopup="dialog"
        >
          <EllipsisVertical size={16} />
        </button> */}

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-slate-300 bg-transparent text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-950 size-8 p-1 text-xs dark:border-border dark:text-white dark:hover:bg-accent dark:hover:text-accent-foreground"
          aria-label="Alternar navegação"
          title="Alternar navegação"
        >
          <ChevronDown
            size={16}
            className={`shrink-0 w-4 h-4 transition-transform ${isMobileMenuOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );

  // Mobile sidebar content (expansível)
  const mobileSidebarContent = (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed left-0 right-0 z-50 bg-[#F8F8F8] border-b border-slate-200 shadow-xl transition-all duration-300 dark:bg-[#00091A] dark:border-gray-800 ${
        isMobileMenuOpen ? "top-0" : "top-[-100%]"
      }`}
      style={{
        top: isMobileMenuOpen ? `${navbarHeight}px` : "-100%",
        height: `calc(100vh - ${navbarHeight}px)`,
      }}
    >
      {/* Header do menu mobile */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-gray-700">
        <h3 className="font-bold text-slate-950 dark:text-white">
          {listaInfo?.nome || "Minha lista"}
        </h3>

        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-slate-500 hover:text-slate-950 dark:text-gray-400 dark:hover:text-white"
        >
          <ChevronUp size={20} />
        </button>
      </div>

      {/* Conteúdo do menu mobile */}
      <div className="h-[calc(100%-60px)] overflow-y-auto p-3">
        {/* Informações da lista */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              <Clock size={14} /> <span>≈ {totalTime} min</span>
            </div>
            <span className="bg-slate-200 px-2 py-0.5 rounded-full text-slate-700 dark:bg-gray-700 dark:text-gray-300">
              {getDifficultyText()}
            </span>
            {tag && (
              <span
                className={`${tag.color} text-white text-xs font-medium px-3 py-1 rounded-lg inline-flex items-center`}
              >
                {tag.icon}
                {tag.text}
              </span>
            )}
          </div>
        </div>

        {/* ✅ Estatísticas mobile */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          {isSimuladoOuProva ? (
            <>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Circle size={14} /> {answeredCount}
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
                <Square size={14} /> {unansweredCount}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Mail size={14} /> {correctCount}
              </div>
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <XCircle size={14} /> {incorrectCount}
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
                <Square size={14} /> {unansweredCount}
              </div>
            </>
          )}
        </div>

        {/* ✅ Barras de progresso mobile */}
        <div className="flex gap-1 mb-4">
          {isSimuladoOuProva ? (
            <>
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-500 ease-out"
                style={{
                  width: `${(answeredCount / questions.length) * 100}%`,
                }}
              ></div>
              <div
                className="h-2 rounded-full bg-slate-300 transition-all duration-500 ease-out dark:bg-gray-600"
                style={{
                  width: `${(unansweredCount / questions.length) * 100}%`,
                }}
              ></div>
            </>
          ) : (
            <>
              <div
                className="h-2 rounded-full bg-green-500 transition-all duration-500 ease-out"
                style={{ width: `${(correctCount / questions.length) * 100}%` }}
              ></div>
              <div
                className="h-2 rounded-full bg-red-500 transition-all duration-500 ease-out"
                style={{
                  width: `${(incorrectCount / questions.length) * 100}%`,
                }}
              ></div>
              <div
                className="h-2 rounded-full bg-slate-300 transition-all duration-500 ease-out dark:bg-gray-600"
                style={{
                  width: `${(unansweredCount / questions.length) * 100}%`,
                }}
              ></div>
            </>
          )}
        </div>

        {/* Questões com scroll horizontal */}
        <div className="mb-4">{questionsBarMobile}</div>

        {/* Ações rápidas */}
        <div className="space-y-2">
          {isSimuladoOuProva && resolucaoId && (
            <button
              onClick={() => {
                onFinalizarTentativa?.();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-all duration-300"
            >
              <Flag size={14} />
              Finalizar {listaInfo?.tipo === "simulado" ? "Simulado" : "Prova"}
            </button>
          )}

          {/* <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-pink-600 hover:bg-pink-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-all duration-300"
          >
            <FileText size={14} />
            Gerar PDF da lista <span className="bg-white text-pink-600 px-2 py-1 rounded-md text-xs font-bold">PDF</span>
          </motion.button> */}
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-gray-700">
          <div className="text-center">
            {/* <span className={`text-xs font-medium ${resolucaoId ? 'text-green-400' : 'text-yellow-400'}`}>
              {resolucaoId
                ? `✓ Tentativa #${resolucaoId} ativa`
                : '⚠ Aguardando início da tentativa'
              }
              {isSimuladoOuProva && ` (${listaInfo?.tipo})`}
            </span> */}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Renderização condicional baseada no viewport
  if (isMobileView) {
    return (
      <>
        <div
          className={`fixed top-0 left-0 right-0 z-40 bg-[#F8F8F8] border-b border-slate-200 dark:bg-[#00091A] dark:border-gray-800 ${className}`}
          style={{ top: `${navbarHeight}px` }}
        >
          {mobileHeader}
        </div>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {mobileSidebarContent}
      </>
    );
  }

  // Desktop view
  return (
    <div
      className={`w-80 flex-shrink-0 bg-[#F8F8F8] border-r border-slate-200 text-slate-950 dark:bg-[#00091A] dark:border-gray-800 dark:text-white flex flex-col ${className}`}
    >
      {desktopSidebar}
    </div>
  );
};

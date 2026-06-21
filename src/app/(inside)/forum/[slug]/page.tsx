// app/forum/[slug]/page.tsx
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Loader2,
  Lock,
  MessageCircle,
  MoreVertical,
  Send,
  Trash2,
  Unlock,
  ThumbsUp,
  UserCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { api } from "@/lib/axios";
import { processMarkdown } from "@/utils/markdownProcessor";
import { toggleLike } from "@/lib/course/like";
import { markdownProcessorAlternativas } from "@/utils/markdownProcessorAlternativas";
import { ImageLightbox } from "@/components/editor/ImageLightbox";
import MarkdownEditor from "@/components/editor/MarkDownEditor";
import { ModelQuestions } from "@/components/questions/ModelQuestions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AnimatedRoleName } from "@/components/user/AnimatedRoleName";
import {
  type ForumAuthor,
  type ForumRole,
  getAuthorLevel,
  getAuthorLevelTitle,
  getAuthorPrimaryRole,
  getAuthorRoles,
} from "@/lib/forum/author";

type ForumReply = {
  id: number;
  user_id: number;
  forum_thread_id?: number;
  body: string;
  is_solution?: boolean;
  likes_count?: number;
  liked_by_me?: boolean;
  created_at: string;
  updated_at: string;
  author?: ForumAuthor | null;
};

type Alternativa = {
  id: number;
  letra?: string | null;
  texto: string;
  ordem?: number | null;
};

type Topico = {
  id: number;
  nome: string;
  assunto?: {
    id: number;
    nome: string;
    frente?: {
      id: number;
      nome: string;
    } | null;
  } | null;
};

type ForumQuestaoLinkable = {
  id: number;
  prova_id?: number | null;
  tipo?: string | null;
  alternativa_correta_id?: number | null;
  enunciado: string;
  resposta_esperada?: string | null;
  criterio_correcao?: string | null;
  gabarito_certo_errado?: string | null;
  resposta_numerica?: string | null;
  gabarito_comentado_texto?: string | null;
  gabarito_video?: string | null;
  minutagem?: string | null;
  tempo_resolucao?: number | null;
  adaptado?: boolean | number | null;
  dificuldade?: number | null;
  alternativas?: Alternativa[];
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
  topicos?: Topico[];
  created_at?: string;
  updated_at?: string;
};

type ForumThread = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  linkable_type?: string | null;
  linkable_id?: number | null;
  linkable?: ForumQuestaoLinkable | ForumCourseLinkable | null;
  is_closed: boolean;
  best_reply_id?: number | null;
  replies?: ForumReply[];
  replies_count?: number;
  likes_count?: number;
  liked_by_me?: boolean;
  created_at: string;
  updated_at: string;
  author?: ForumAuthor | null;
};

type ModelQuestao = {
  id: number;
  tipo: string;
  enunciado: string;
  alternativas: Array<{
    id: number;
    letra: string;
    texto: string;
  }>;
  alternativa_correta_id: number;
  gabarito_video?: string | null;
  gabarito_comentado_texto?: string | null;
  dificuldade?: number | null;
  adaptado?: boolean | number | null;
  topicos?: Array<{
    id: number;
    nome: string;
  }>;
  prova?: ForumQuestaoLinkable["prova"];
};

type ForumCourseLinkable = {
  id: number;
  module_id?: number | null;
  title?: string | null;
  content_type?: string | null;
  estimated_time_minutes?: number | null;
  duration_in_seconds?: number | null;
  content_url?: string | null;
  list_id?: number | null;
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

function getUserIdFromSession(session: any): number | null {
  const rawId = session?.user?.id ?? session?.id ?? null;
  const id = Number(rawId);

  return Number.isFinite(id) ? id : null;
}

function authHeaders(token: string) {
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function isCourseThread(thread: ForumThread | null): boolean {
  return (
    thread?.linkable_type === "App\\Models\\CourseContent" &&
    Boolean(thread?.linkable)
  );
}

function formatDurationFromSeconds(seconds?: number | null) {
  const totalSeconds = Number(seconds ?? 0);

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return null;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}min`;
  }

  return `${minutes}min${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ""}`;
}

function isQuestaoThread(thread: ForumThread | null): boolean {
  return (
    thread?.linkable_type === "App\\Models\\Questao" &&
    Boolean(thread?.linkable)
  );
}

function isForumQuestaoLinkable(
  linkable: ForumThread["linkable"],
): linkable is ForumQuestaoLinkable {
  return Boolean(
    linkable &&
    "enunciado" in linkable &&
    typeof linkable.enunciado === "string",
  );
}

function isForumCourseLinkable(
  linkable: ForumThread["linkable"],
): linkable is ForumCourseLinkable {
  return Boolean(
    linkable &&
    !("enunciado" in linkable) &&
    ("content_url" in linkable ||
      "content_type" in linkable ||
      "duration_in_seconds" in linkable ||
      "list_id" in linkable),
  );
}

function getDifficultyLabel(dificuldade?: number | null) {
  switch (Number(dificuldade)) {
    case 1:
      return "Muito Fácil";
    case 2:
      return "Fácil";
    case 3:
      return "Médio";
    case 4:
      return "Difícil";
    case 5:
      return "Muito Difícil";
    default:
      return null;
  }
}

function getDifficultyClass(dificuldade?: number | null) {
  switch (Number(dificuldade)) {
    case 1:
      return "border-green-400 bg-green-100 text-green-800";
    case 2:
      return "border-lime-400 bg-lime-100 text-lime-800";
    case 3:
      return "border-yellow-400 bg-yellow-100 text-yellow-800";
    case 4:
      return "border-orange-500 bg-orange-100 text-orange-800";
    case 5:
      return "border-red-500 bg-red-100 text-red-800";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
}

function ForumAuthorAvatar({
  author,
  sizeClassName = "h-9 w-9",
}: {
  author?: ForumAuthor | null;
  sizeClassName?: string;
}) {
  const avatar = (author as any)?.avatar;
  const name = author?.name ?? "Usuário";

  return (
    <span
      className={`inline-flex ${sizeClassName} shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-300`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={`Avatar de ${name}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserCircle2 className="h-[70%] w-[70%]" />
      )}
    </span>
  );
}

function ActionMenu({
  children,
  align = "right",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <details className="group relative inline-flex">
      <summary
        className="inline-flex min-h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 [&::-webkit-details-marker]:hidden dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Abrir ações"
        title="Ações"
      >
        <MoreVertical className="h-4 w-4" />
      </summary>

      <div
        className={[
          "absolute top-[calc(100%+8px)] z-50 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#08111F]",
          align === "right" ? "right-0" : "left-0",
        ].join(" ")}
      >
        <div className="grid gap-1">{children}</div>
      </div>
    </details>
  );
}

function ForumThreadLikeButton({
  token,
  threadId,
  initialLiked = false,
  initialCount = 0,
}: {
  token: string;
  threadId: number;
  initialLiked?: boolean;
  initialCount?: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const disabled = !token || loading || !threadId;

  const handleToggleLike = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (disabled) return;

    const previousLiked = liked;
    const previousCount = likesCount;

    const nextLiked = !previousLiked;
    const nextCount = nextLiked
      ? previousCount + 1
      : Math.max(0, previousCount - 1);

    setLiked(nextLiked);
    setLikesCount(nextCount);

    if (nextLiked) {
      setBurstKey((key) => key + 1);
    }

    try {
      setLoading(true);

      const response = await toggleLike(token, {
        entity_type: "duvida",
        entity_id: threadId,
      });

      setLiked(response.liked);
      setLikesCount(response.likes_count);
    } catch (error) {
      console.error("Erro ao curtir dúvida do fórum:", error);

      setLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggleLike}
      disabled={disabled}
      aria-pressed={liked}
      title={liked ? "Remover curtida" : "Curtir dúvida"}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      className={`cursor-pointer
        relative inline-flex min-h-10 items-center justify-center gap-1.5 overflow-hidden
        rounded-xl border px-3 py-2 text-xs font-bold transition
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          liked
            ? "border-blue-500/40 bg-blue-50 text-[#0E00D0] dark:bg-blue-500/15 dark:text-blue-200"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        }
      `}
    >
      <AnimatePresence>
        {liked && (
          <motion.span
            key={burstKey}
            initial={{ scale: 0.2, opacity: 0.45 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute h-8 w-8 rounded-full bg-blue-500/30"
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={
          liked
            ? {
                scale: [1, 1.25, 1],
                rotate: [0, -8, 8, 0],
              }
            : {
                scale: 1,
                rotate: 0,
              }
        }
        transition={{ duration: 0.32 }}
        className="relative z-10 inline-flex"
      >
        <ThumbsUp className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
      </motion.span>

      <span className="relative z-10">{liked ? "Curtido" : "Curtir"}</span>

      {likesCount > 0 && (
        <motion.span
          key={likesCount}
          initial={{ y: -3, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 text-[11px] opacity-80"
        >
          {likesCount}
        </motion.span>
      )}

      {loading && (
        <span className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden">
          <motion.span
            className="block h-full w-1/2 bg-blue-400"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          />
        </span>
      )}
    </motion.button>
  );
}

function ForumReplyLikeButton({
  token,
  replyId,
  initialLiked = false,
  initialCount = 0,
}: {
  token: string;
  replyId: number;
  initialLiked?: boolean;
  initialCount?: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const disabled = !token || loading || !replyId;

  const handleToggleLike = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (disabled) return;

    const previousLiked = liked;
    const previousCount = likesCount;

    const nextLiked = !previousLiked;
    const nextCount = nextLiked
      ? previousCount + 1
      : Math.max(0, previousCount - 1);

    setLiked(nextLiked);
    setLikesCount(nextCount);

    if (nextLiked) {
      setBurstKey((key) => key + 1);
    }

    try {
      setLoading(true);

      const response = await toggleLike(token, {
        entity_type: "resposta_forum",
        entity_id: replyId,
      });

      setLiked(response.liked);
      setLikesCount(response.likes_count);
    } catch (error) {
      console.error("Erro ao curtir resposta do fórum:", error);

      setLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggleLike}
      disabled={disabled}
      aria-pressed={liked}
      title={liked ? "Remover curtida" : "Curtir resposta"}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      className={`
        relative inline-flex items-center justify-center gap-1.5 overflow-hidden
        rounded-lg border px-2.5 py-1.5 text-xs font-bold transition
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          liked
            ? "border-blue-500/40 bg-blue-50 text-[#0E00D0] dark:bg-blue-500/15 dark:text-blue-200"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        }
      `}
    >
      <AnimatePresence>
        {liked && (
          <motion.span
            key={burstKey}
            initial={{ scale: 0.2, opacity: 0.45 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute h-7 w-7 rounded-full bg-blue-500/30"
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={
          liked
            ? {
                scale: [1, 1.25, 1],
                rotate: [0, -8, 8, 0],
              }
            : {
                scale: 1,
                rotate: 0,
              }
        }
        transition={{ duration: 0.32 }}
        className="relative z-10 inline-flex"
      >
        <ThumbsUp className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
      </motion.span>

      <span className="relative z-10">{liked ? "Curtido" : "Curtir"}</span>

      {likesCount > 0 && (
        <motion.span
          key={likesCount}
          initial={{ y: -3, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 text-[11px] opacity-80"
        >
          {likesCount}
        </motion.span>
      )}
    </motion.button>
  );
}

function normalizeQuestionForModel(
  question: ForumQuestaoLinkable,
): ModelQuestao {
  const alternativas = safeArray(question.alternativas)
    .slice()
    .sort((a, b) => {
      const ordemA = Number(a.ordem ?? 0);
      const ordemB = Number(b.ordem ?? 0);

      if (ordemA !== ordemB) return ordemA - ordemB;

      return String(a.letra ?? "").localeCompare(String(b.letra ?? ""));
    })
    .map((alternativa, index) => ({
      id: alternativa.id,
      letra: alternativa.letra ?? String.fromCharCode(65 + index),
      texto: alternativa.texto ?? "",
    }));

  return {
    id: question.id,
    tipo: question.tipo ?? "objetiva",
    enunciado: question.enunciado ?? "",
    alternativas,
    alternativa_correta_id: Number(question.alternativa_correta_id ?? 0),
    gabarito_video: question.gabarito_video ?? null,
    gabarito_comentado_texto: question.gabarito_comentado_texto ?? null,
    dificuldade: question.dificuldade ?? null,
    adaptado: question.adaptado ?? null,
    topicos: safeArray(question.topicos).map((topico) => ({
      id: topico.id,
      nome: topico.nome,
    })),
    prova: question.prova ?? null,
  };
}

function shouldZoomImage(target: HTMLElement) {
  if (target.tagName !== "IMG") return false;

  const isInsideZoomScope =
    target.closest(".markdown-body") ||
    target.closest("[data-zoom-scope='forum']") ||
    target.closest("[data-zoom-scope='forum-question']");

  const isInsideForbiddenArea =
    target.closest("button") ||
    target.closest("nav") ||
    target.closest("[role='menu']") ||
    target.closest("[role='dialog']");

  return Boolean(isInsideZoomScope && !isInsideForbiddenArea);
}

function MarkdownBlock({
  body,
  className = "",
}: {
  body: string;
  className?: string;
}) {
  const [processedBody, setProcessedBody] = useState(body ?? "");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const html = await processMarkdown(body ?? "");

        if (!cancelled) {
          setProcessedBody(html);
        }
      } catch {
        if (!cancelled) {
          setProcessedBody(body ?? "");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [body]);

  return (
    <div
      data-zoom-scope="forum"
      className={[
        "markdown-body wmde-markdown wmde-markdown-color break-words text-sm leading-relaxed text-slate-800 dark:text-slate-100 sm:text-base",
        "[&_img]:my-3 [&_img]:max-h-[70vh] [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-white/10 [&_img]:object-contain",
        className,
      ].join(" ")}
      style={
        {
          "--color-canvas-default": "transparent",
          "--color-fg-default": "currentColor",
        } as CSSProperties
      }
      dangerouslySetInnerHTML={{
        __html: processedBody,
      }}
    />
  );
}

function MarkdownEditorBox({
  initialContent,
  onChange,
  placeholder,
  editorKey,
}: {
  initialContent: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editorKey: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#050B1A]">
      <MarkdownEditor
        key={editorKey}
        initialContent={initialContent}
        onChange={(content: string) => {
          onChange(content ?? "");
        }}
      />
    </div>
  );
}

function LinkedQuestionFallback({
  question,
}: {
  question: ForumQuestaoLinkable;
}) {
  const [showFullQuestion, setShowFullQuestion] = useState(true);
  const [showTopics, setShowTopics] = useState(false);
  const [processedEnunciado, setProcessedEnunciado] = useState(
    question.enunciado ?? "",
  );
  const [processedAlternativas, setProcessedAlternativas] = useState<
    Record<number, string>
  >({});
  const [isProcessing, setIsProcessing] = useState(true);

  const alternativas = useMemo(() => {
    return safeArray(question.alternativas)
      .slice()
      .sort((a, b) => {
        const ordemA = Number(a.ordem ?? 0);
        const ordemB = Number(b.ordem ?? 0);

        if (ordemA !== ordemB) return ordemA - ordemB;

        return String(a.letra ?? "").localeCompare(String(b.letra ?? ""));
      });
  }, [question.alternativas]);

  const topicos = safeArray(question.topicos);
  const difficultyLabel = getDifficultyLabel(question.dificuldade);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsProcessing(true);

      try {
        const html = await processMarkdown(question.enunciado ?? "");
        const alternativasMap: Record<number, string> = {};

        for (const alternativa of alternativas) {
          alternativasMap[alternativa.id] = await markdownProcessorAlternativas(
            alternativa.texto ?? "",
          );
        }

        if (!cancelled) {
          setProcessedEnunciado(html);
          setProcessedAlternativas(alternativasMap);
        }
      } catch {
        if (!cancelled) {
          setProcessedEnunciado(question.enunciado ?? "");

          const fallback: Record<number, string> = {};

          for (const alternativa of alternativas) {
            fallback[alternativa.id] = alternativa.texto ?? "";
          }

          setProcessedAlternativas(fallback);
        }
      } finally {
        if (!cancelled) {
          setIsProcessing(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [question.id, question.enunciado, alternativas]);

  return (
    <section
      data-zoom-scope="forum-question"
      className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl dark:border-blue-500/30 dark:bg-[#050B1A]"
    >
      <header className="border-b border-blue-200 bg-gradient-to-r from-[#0E00D0] to-[#2563eb] px-4 py-4 sm:px-5 dark:border-white/10 dark:from-[#0E00D0] dark:to-[#111827]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/80">
          Questão associada
        </p>

        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
            Questão #{question.id}
          </h2>

          <div className="flex flex-wrap gap-2">
            {question.prova?.sigla && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {question.prova.sigla}
              </span>
            )}

            {question.prova?.ano && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {question.prova.ano}
              </span>
            )}

            {question.prova?.banca?.sigla && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {question.prova.banca.sigla}
              </span>
            )}

            {difficultyLabel && (
              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-bold",
                  getDifficultyClass(question.dificuldade),
                ].join(" ")}
              >
                {difficultyLabel}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 dark:border-white/10 dark:bg-[#0B1220]">
        <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowFullQuestion((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            {showFullQuestion ? (
              <>
                Ocultar questão <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Mostrar questão <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowTopics((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            {showTopics ? (
              <>
                Ocultar tópicos <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Ver tópicos <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showTopics && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-3 flex flex-wrap gap-2"
            >
              {topicos.length > 0 ? (
                topicos.map((topico) => (
                  <span
                    key={topico.id}
                    className="rounded-full bg-blue-900/70 px-3 py-1 text-xs font-semibold text-blue-100"
                  >
                    {topico.assunto?.frente?.nome
                      ? `${topico.assunto.frente.nome} · ${topico.nome}`
                      : topico.nome}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Sem tópicos cadastrados
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {showFullQuestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-3 py-4 sm:px-5">
              {isProcessing ? (
                <div className="space-y-3">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                </div>
              ) : (
                <>
                  <div
                    className="markdown-body wmde-markdown wmde-markdown-color break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 sm:text-base [&_img]:my-3 [&_img]:max-h-[70vh] [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-white/10 [&_img]:object-contain"
                    style={
                      {
                        "--color-canvas-default": "transparent",
                        "--color-fg-default": "currentColor",
                      } as CSSProperties
                    }
                    dangerouslySetInnerHTML={{
                      __html: processedEnunciado,
                    }}
                  />

                  {alternativas.length > 0 ? (
                    <div className="space-y-2">
                      {alternativas.map((alternativa, index) => {
                        const isCorrect =
                          alternativa.id === question.alternativa_correta_id;

                        return (
                          <div
                            key={alternativa.id}
                            className={[
                              "flex gap-3 rounded-xl border p-3 text-sm transition sm:text-base",
                              isCorrect
                                ? "border-green-400 bg-green-50 dark:border-green-500/40 dark:bg-green-500/10"
                                : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]",
                            ].join(" ")}
                          >
                            <div
                              className={[
                                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                                isCorrect
                                  ? "border-green-400 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-white",
                              ].join(" ")}
                            >
                              {String(
                                alternativa.letra ??
                                  String.fromCharCode(65 + index),
                              ).toUpperCase()}
                            </div>

                            <div
                              className="markdown-body wmde-markdown wmde-markdown-color min-w-0 flex-1 break-words text-slate-800 dark:text-slate-100 [&_img]:my-3 [&_img]:max-h-[70vh] [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-white/10 [&_img]:object-contain"
                              style={
                                {
                                  "--color-canvas-default": "transparent",
                                  "--color-fg-default": "currentColor",
                                } as CSSProperties
                              }
                              dangerouslySetInnerHTML={{
                                __html:
                                  processedAlternativas[alternativa.id] ??
                                  alternativa.texto,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-xs text-yellow-800 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-100 sm:text-sm">
                      Esta questão chegou ao fórum sem alternativas carregadas.
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function LinkedQuestionCard({ question }: { question: ForumQuestaoLinkable }) {
  const hasAlternatives = safeArray(question.alternativas).length > 0;

  if (!hasAlternatives) {
    return <LinkedQuestionFallback question={question} />;
  }

  return (
    <section
      data-zoom-scope="forum-question"
      className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl dark:border-blue-500/30 dark:bg-[#050B1A]"
    >
      <header className="border-b border-blue-200 bg-gradient-to-r from-[#0E00D0] to-[#2563eb] px-4 py-4 sm:px-5 dark:border-white/10 dark:from-[#0E00D0] dark:to-[#111827]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/80">
          Questão associada
        </p>

        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
            Questão #{question.id}
          </h2>

          <div className="flex flex-wrap gap-2">
            {question.prova?.sigla && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {question.prova.sigla}
              </span>
            )}

            {question.prova?.ano && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {question.prova.ano}
              </span>
            )}

            {question.prova?.banca?.sigla && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {question.prova.banca.sigla}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="px-0 py-0">
        <ModelQuestions
          question={normalizeQuestionForModel(question) as any}
          singleMode
          showEmptyState={false}
          className="!min-h-0 [&>div>div]:!max-w-none [&>div>div]:!p-0 sm:[&>div>div]:!p-3 lg:[&>div>div]:!p-4"
        />
      </div>
    </section>
  );
}

function LinkedLessonCard({ lesson }: { lesson: ForumCourseLinkable }) {
  const duration = formatDurationFromSeconds(lesson.duration_in_seconds);

  return (
    <section className="overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-xl dark:border-purple-500/30 dark:bg-[#050B1A]">
      <header className="border-b border-purple-200 bg-gradient-to-r from-[#0E00D0] via-[#2563eb] to-[#111827] px-4 py-4 sm:px-5 dark:border-white/10 dark:from-[#0E00D0] dark:via-[#1A0BFF] dark:to-[#111827]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-100/80">
          Aula relacionada
        </p>

        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
            {lesson.title ?? `Aula #${lesson.id}`}
          </h2>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              Aula #{lesson.id}
            </span>

            {lesson.content_type && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-white">
                {lesson.content_type}
              </span>
            )}

            {duration && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {duration}
              </span>
            )}
          </div>
        </div>
      </header>

      {lesson.content_url ? (
        <div className="p-3 sm:p-5">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black pt-[56.25%] dark:border-white/10">
            <iframe
              src={lesson.content_url}
              className="absolute left-0 top-0 h-full w-full border-0"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={`Vídeo: ${lesson.title ?? `Aula #${lesson.id}`}`}
            />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Esta dúvida está relacionada a esta aula. Assista ao vídeo para
            entender melhor o contexto.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-100">
            Esta aula está vinculada à dúvida, mas o link do player não veio no
            retorno da API.
          </div>
        </div>
      )}
    </section>
  );
}

function ReplyCard({
  reply,
  token,
  isBest,
  isAuthor,
  canMarkBest,
  onMarkBest,
  onDelete,
  onStartEdit,
  isEditing,
  editValue,
  onEditChange,
  onCancelEdit,
  onSaveEdit,
  isActionLoading,
}: {
  reply: ForumReply;
  token: string;
  isBest: boolean;
  isAuthor: boolean;
  canMarkBest: boolean;
  onMarkBest: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  isActionLoading: boolean;
}) {
  return (
    <article
      className={[
        "rounded-2xl border p-4 shadow-lg sm:p-5",
        isBest
          ? "border-green-400 bg-green-50 dark:border-green-500/40 dark:bg-green-500/10"
          : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#0B1220]",
      ].join(" ")}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ForumAuthorAvatar author={reply.author} sizeClassName="h-10 w-10" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-slate-950 dark:text-white">
                <AnimatedRoleName
                  name={reply.author?.name ?? "Usuário"}
                  roles={getAuthorRoles(reply.author)}
                  role={getAuthorPrimaryRole(reply.author)}
                  level={getAuthorLevel(reply.author)}
                  levelTitle={getAuthorLevelTitle(reply.author)}
                  nameClassName="text-sm"
                />
              </p>

              {isBest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700 dark:bg-green-500/20 dark:text-green-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Melhor resposta
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatDate(reply.created_at)}
            </p>
          </div>
        </div>

        {(canMarkBest || isAuthor) && !isEditing && (
          <ActionMenu>
            {canMarkBest && !isBest && (
              <button
                type="button"
                onClick={onMarkBest}
                disabled={isActionLoading}
                className="inline-flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-200 dark:hover:bg-green-500/10"
              >
                {isActionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Marcar melhor
              </button>
            )}

            {isAuthor && (
              <>
                <button
                  type="button"
                  onClick={onStartEdit}
                  disabled={isActionLoading}
                  className="cursor-pointer inline-flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-200 dark:hover:bg-blue-500/10"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isActionLoading}
                  className="cursor-pointer inline-flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-200 dark:hover:bg-red-500/10"
                >
                  {isActionLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Apagar
                </button>
              </>
            )}
          </ActionMenu>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <MarkdownEditorBox
            editorKey={`edit-reply-${reply.id}-${isEditing ? "on" : "off"}`}
            initialContent={editValue}
            onChange={onEditChange}
            placeholder="Edite sua resposta..."
          />

          <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={onCancelEdit}
              className="cursor-pointer inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onSaveEdit}
              disabled={isActionLoading || !editValue.trim()}
              className="cursor-pointer inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar resposta"
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          <MarkdownBlock body={reply.body} />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ForumReplyLikeButton
              token={token}
              replyId={reply.id}
              initialLiked={Boolean(reply.liked_by_me)}
              initialCount={reply.likes_count ?? 0}
            />
          </div>
        </>
      )}
    </article>
  );
}

export default function ForumThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const token = useMemo(() => getTokenFromSession(session), [session]);
  const currentUserId = useMemo(() => getUserIdFromSession(session), [session]);

  const slug = useMemo(() => {
    const raw = params?.slug;

    if (Array.isArray(raw)) return raw[0] ?? "";

    return raw ? String(raw) : "";
  }, [params]);

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editingThread, setEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editReplyBody, setEditReplyBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const isThreadAuthor =
    Boolean(thread && currentUserId) &&
    Number(thread?.user_id) === Number(currentUserId);

  const fetchThread = useCallback(async () => {
    if (status === "loading") return;

    if (!slug) {
      setErrorMessage("Tópico não encontrado.");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setErrorMessage("Usuário não autenticado. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.get(`/forum/threads/${slug}`, {
        headers: authHeaders(token),
      });

      const data = response.data?.thread ?? response.data;

      setThread(data);
      setEditTitle(data?.title ?? "");
      setEditBody(data?.body ?? "");
    } catch (error: any) {
      console.error("Erro ao carregar tópico do fórum:", error);

      setErrorMessage(
        error?.response?.data?.message ??
          "Não foi possível carregar este tópico.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug, status, token]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!shouldZoomImage(target)) return;

      const src = target.getAttribute("src");

      if (src) {
        setZoomedImageUrl(src);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", handleImageClick, true);

    return () => {
      document.removeEventListener("click", handleImageClick, true);
    };
  }, []);

  function startEditThread() {
    if (!thread) return;

    setEditingReplyId(null);
    setEditReplyBody("");

    setEditTitle(thread.title ?? "");
    setEditBody(thread.body ?? "");
    setEditingThread(true);
  }

  function cancelEditThread() {
    setEditingThread(false);
    setEditTitle("");
    setEditBody("");
  }

  function startEditReply(reply: ForumReply) {
    setEditingThread(false);
    setEditTitle("");
    setEditBody("");

    setEditReplyBody(reply.body ?? "");
    setEditingReplyId(reply.id);
  }

  function cancelEditReply() {
    setEditingReplyId(null);
    setEditReplyBody("");
  }

  async function handlePostReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!thread || !replyBody.trim() || isPostingReply) return;

    if (!token) {
      alert("Usuário não autenticado. Faça login novamente.");
      return;
    }

    setIsPostingReply(true);

    try {
      await api.post(
        `/forum/threads/${thread.id}/replies`,
        {
          body: replyBody.trim(),
        },
        {
          headers: authHeaders(token),
        },
      );

      setReplyBody("");
      await fetchThread();
    } catch (error: any) {
      console.error("Erro ao responder tópico:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível enviar sua resposta.",
      );
    } finally {
      setIsPostingReply(false);
    }
  }

  async function handleUpdateThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!thread || !editTitle.trim() || !editBody.trim()) return;

    setActionLoading("update-thread");

    try {
      const response = await api.put(
        `/forum/threads/${thread.id}`,
        {
          title: editTitle.trim(),
          body: editBody.trim(),
        },
        {
          headers: authHeaders(token),
        },
      );

      const updated = response.data?.thread ?? response.data;

      setThread(updated);
      setEditingThread(false);
      setEditTitle("");
      setEditBody("");
    } catch (error: any) {
      console.error("Erro ao editar tópico:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível editar esta dúvida.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateReply(replyId: number) {
    if (!thread || !editReplyBody.trim()) return;

    setActionLoading(`edit-reply-${replyId}`);

    try {
      await api.put(
        `/forum/threads/${thread.id}/replies/${replyId}`,
        {
          body: editReplyBody.trim(),
        },
        {
          headers: authHeaders(token),
        },
      );

      setEditingReplyId(null);
      setEditReplyBody("");
      await fetchThread();
    } catch (error: any) {
      console.error("Erro ao editar resposta:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível editar esta resposta.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCloseThread() {
    if (!thread) return;

    setActionLoading("close-thread");

    try {
      const response = await api.post(
        `/forum/threads/${thread.id}/close`,
        {},
        {
          headers: authHeaders(token),
        },
      );

      setThread(response.data?.thread ?? response.data);
    } catch (error: any) {
      console.error("Erro ao fechar tópico:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível fechar esta dúvida.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReopenThread() {
    if (!thread) return;

    setActionLoading("reopen-thread");

    try {
      const response = await api.post(
        `/forum/threads/${thread.id}/reopen`,
        {},
        {
          headers: authHeaders(token),
        },
      );

      setThread(response.data?.thread ?? response.data);
    } catch (error: any) {
      console.error("Erro ao reabrir tópico:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível reabrir esta dúvida.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteThread() {
    if (!thread) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja apagar esta dúvida?",
    );

    if (!confirmed) return;

    setActionLoading("delete-thread");

    try {
      await api.delete(`/forum/threads/${thread.id}`, {
        headers: authHeaders(token),
      });

      router.push("/forum");
    } catch (error: any) {
      console.error("Erro ao apagar tópico:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível apagar esta dúvida.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkBestReply(replyId: number) {
    if (!thread) return;

    setActionLoading(`best-${replyId}`);

    try {
      await api.post(
        `/forum/threads/${thread.id}/replies/${replyId}/best`,
        {},
        {
          headers: authHeaders(token),
        },
      );

      await fetchThread();
    } catch (error: any) {
      console.error("Erro ao marcar melhor resposta:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível marcar a melhor resposta.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteReply(replyId: number) {
    if (!thread) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja apagar esta resposta?",
    );

    if (!confirmed) return;

    setActionLoading(`delete-reply-${replyId}`);

    try {
      await api.delete(`/forum/threads/${thread.id}/replies/${replyId}`, {
        headers: authHeaders(token),
      });

      await fetchThread();
    } catch (error: any) {
      console.error("Erro ao apagar resposta:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível apagar esta resposta.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  const replies: ForumReply[] = safeArray<ForumReply>(thread?.replies);

  const linkedQuestion: ForumQuestaoLinkable | null =
    isQuestaoThread(thread) && isForumQuestaoLinkable(thread?.linkable)
      ? thread.linkable
      : null;

  const linkedLesson: ForumCourseLinkable | null =
    isCourseThread(thread) && isForumCourseLinkable(thread?.linkable)
      ? thread.linkable
      : null;

  useDocumentTitle(thread?.title ?? "Fórum");

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-slate-950 dark:bg-[#00091A] dark:text-white">
      <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/forum")}
          className="cursor-pointer mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao fórum
        </button>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
            <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {errorMessage}
          </div>
        ) : !thread ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">
              Tópico não encontrado
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              O tópico solicitado não existe ou não está disponível.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0B1220]"
            >
              <header className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5 dark:border-white/10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {editingThread ? (
                      <form onSubmit={handleUpdateThread} className="space-y-3">
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          placeholder="Título da dúvida"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0E00D0] dark:border-white/10 dark:bg-[#050B1A] dark:text-white dark:placeholder:text-slate-500 sm:text-2xl"
                        />

                        <MarkdownEditorBox
                          editorKey={`edit-thread-${thread.id}-${editingThread ? "on" : "off"}`}
                          initialContent={editBody}
                          onChange={setEditBody}
                          placeholder="Edite o corpo da dúvida..."
                        />

                        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">
                          <button
                            type="submit"
                            disabled={
                              actionLoading === "update-thread" ||
                              !editTitle.trim() ||
                              !editBody.trim()
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                          >
                            {actionLoading === "update-thread" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              "Salvar alterações"
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditThread}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:w-auto"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h1 className="break-words text-xl font-bold leading-tight text-slate-950 dark:text-white sm:text-2xl lg:text-3xl">
                          {thread.title}
                        </h1>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <ForumAuthorAvatar
                              author={thread.author}
                              sizeClassName="h-8 w-8"
                            />

                            <span className="min-w-0 truncate">
                              <AnimatedRoleName
                                name={thread.author?.name ?? "Usuário"}
                                roles={getAuthorRoles(thread.author)}
                                role={getAuthorPrimaryRole(thread.author)}
                                level={getAuthorLevel(thread.author)}
                                levelTitle={getAuthorLevelTitle(thread.author)}
                                nameClassName="text-xs sm:text-sm"
                              />
                            </span>
                          </span>

                          <span>•</span>

                          <span>{formatDate(thread.created_at)}</span>

                          <span>•</span>

                          <span
                            className={
                              thread.is_closed
                                ? "inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                                : "inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                            }
                          >
                            {thread.is_closed ? (
                              <>
                                <Lock className="h-3.5 w-3.5" />
                                Fechado
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-3.5 w-3.5" />
                                Aberto
                              </>
                            )}
                          </span>

                          {linkedQuestion && (
                            <>
                              <span>•</span>

                              <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                                Questão #{linkedQuestion.id}
                              </span>
                            </>
                          )}

                          {linkedLesson && (
                            <>
                              <span>•</span>

                              <span className="rounded-full bg-purple-50 px-2 py-1 font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-200">
                                Aula #{linkedLesson.id}
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {!editingThread && (
                    <div className="flex items-start justify-end gap-2 lg:min-w-[140px]">
                      <ForumThreadLikeButton
                        token={token}
                        threadId={thread.id}
                        initialLiked={Boolean(thread.liked_by_me)}
                        initialCount={thread.likes_count ?? 0}
                      />

                      {isThreadAuthor && (
                        <ActionMenu>
                          {!thread.is_closed ? (
                            <>
                              <button
                                type="button"
                                onClick={startEditThread}
                                className="inline-flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-blue-700 transition hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={handleCloseThread}
                                disabled={actionLoading === "close-thread"}
                                className="inline-flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-yellow-700 transition hover:bg-yellow-50 disabled:opacity-50 dark:text-yellow-200 dark:hover:bg-yellow-500/10"
                              >
                                {actionLoading === "close-thread" ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5" />
                                )}
                                Fechar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleReopenThread}
                              disabled={actionLoading === "reopen-thread"}
                              className="inline-flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-green-700 transition hover:bg-green-50 disabled:opacity-50 dark:text-green-200 dark:hover:bg-green-500/10"
                            >
                              {actionLoading === "reopen-thread" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Unlock className="h-3.5 w-3.5" />
                              )}
                              Reabrir
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleDeleteThread}
                            disabled={actionLoading === "delete-thread"}
                            className="inline-flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-200 dark:hover:bg-red-500/10"
                          >
                            {actionLoading === "delete-thread" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Apagar
                          </button>
                        </ActionMenu>
                      )}
                    </div>
                  )}
                </div>
              </header>

              <div className="space-y-4 px-3 py-4 sm:px-6 sm:py-5">
                {linkedQuestion && (
                  <LinkedQuestionCard question={linkedQuestion} />
                )}

                {linkedLesson && <LinkedLessonCard lesson={linkedLesson} />}

                {!editingThread && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <MarkdownBlock body={thread.body} />
                  </div>
                )}
              </div>
            </motion.article>

            <section className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                  Respostas
                </h2>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {replies.length}
                </span>
              </div>

              {replies.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-400">
                  Ainda não há respostas neste tópico.
                </div>
              ) : (
                replies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    token={token}
                    isBest={thread.best_reply_id === reply.id}
                    isAuthor={Number(reply.user_id) === Number(currentUserId)}
                    canMarkBest={
                      isThreadAuthor &&
                      !thread.is_closed &&
                      Number(reply.user_id) !== Number(currentUserId)
                    }
                    isEditing={editingReplyId === reply.id}
                    editValue={editReplyBody}
                    onEditChange={setEditReplyBody}
                    onStartEdit={() => startEditReply(reply)}
                    onCancelEdit={cancelEditReply}
                    onSaveEdit={() => handleUpdateReply(reply.id)}
                    isActionLoading={
                      actionLoading === `best-${reply.id}` ||
                      actionLoading === `delete-reply-${reply.id}` ||
                      actionLoading === `edit-reply-${reply.id}`
                    }
                    onMarkBest={() => handleMarkBestReply(reply.id)}
                    onDelete={() => handleDeleteReply(reply.id)}
                  />
                ))
              )}
            </section>

            {!thread.is_closed && !editingThread && editingReplyId === null && (
              <form
                onSubmit={handlePostReply}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#0B1220] sm:p-5"
              >
                <label
                  htmlFor="reply-body"
                  className="mb-2 block text-sm font-semibold text-slate-950 dark:text-white"
                >
                  Responder em Markdown
                </label>

                <MarkdownEditorBox
                  editorKey={`new-reply-${thread.id}`}
                  initialContent={replyBody}
                  onChange={setReplyBody}
                  placeholder="Escreva sua resposta em Markdown..."
                />

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="submit"
                    disabled={isPostingReply || !replyBody.trim()}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isPostingReply ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar resposta
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {thread.is_closed && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                Esta dúvida está fechada e não aceita novas respostas.
              </div>
            )}
          </div>
        )}
      </main>

      {zoomedImageUrl && (
        <ImageLightbox
          imageUrl={zoomedImageUrl}
          onClose={() => setZoomedImageUrl(null)}
        />
      )}
    </div>
  );
}

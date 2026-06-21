// app/forum/page.tsx
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileQuestion,
  GraduationCap,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  ThumbsUp,
  UserCircle2,
  X,
} from "lucide-react";
import { toggleLike } from "@/lib/course/like";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedRoleName } from "@/components/user/AnimatedRoleName";
import {
  type ForumAuthor,
  getAuthorLevel,
  getAuthorLevelTitle,
  getAuthorPrimaryRole,
  getAuthorRoles,
} from "@/lib/forum/author";
import { api } from "@/lib/axios";
import MarkdownEditor from "@/components/editor/MarkDownEditor";
import { processMarkdownPreview } from "@/utils/markdownProcessorPreview";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type FilterType =
  | "all"
  | "questions"
  | "lessons"
  | "general"
  | "unanswered"
  | "answered"
  | "closed"
  | "mine";

type ForumTopico = {
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

type ForumQuestionLinkable = {
  id: number;
  enunciado?: string | null;
  dificuldade?: number | null;
  topicos?: ForumTopico[];
};

type ForumCourseLinkable = {
  id: number;
  module_id?: number | null;
  title?: string | null;
  content_type?: string | null;
  estimated_time_minutes?: number | null;

  module?: {
    id: number;
    title?: string | null;
  } | null;
};

type ForumThread = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  linkable_type?: string | null;
  linkable_id?: number | null;
  linkable?: ForumQuestionLinkable | ForumCourseLinkable | null;
  is_closed: boolean;
  best_reply_id?: number | null;
  replies_count?: number;
  likes_count?: number;
  liked_by_me?: boolean;
  created_at: string;
  updated_at: string;
  author?: ForumAuthor | null;
};

type LaravelPaginatedResponse<T> = {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
};

const filters: Array<{
  value: FilterType;
  label: string;
}> = [
  { value: "all", label: "Todas" },
  { value: "questions", label: "Questões" },
  { value: "lessons", label: "Aulas" },
  { value: "general", label: "Gerais" },
  { value: "unanswered", label: "Sem resposta" },
  { value: "answered", label: "Respondidas" },
  { value: "closed", label: "Resolvidas" },
  { value: "mine", label: "Minhas" },
];

function safeArray<T>(value: T[] | null | undefined): T[] {
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

function getClientToken(): string {
  if (typeof window === "undefined") return "";

  const possibleKeys = [
    "laravelToken",
    "laravel_token",
    "token",
    "auth_token",
    "access_token",
    "sanctum_token",
    "bearer_token",
  ];

  for (const key of possibleKeys) {
    const value = window.localStorage.getItem(key);

    if (value) {
      return value.replace(/^Bearer\s+/i, "").trim();
    }
  }

  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  return cookieToken ? decodeURIComponent(cookieToken) : "";
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

function formatDuration(seconds?: number | null, minutes?: number | null) {
  const totalSeconds =
    typeof seconds === "number" && seconds > 0
      ? seconds
      : typeof minutes === "number" && minutes > 0
        ? minutes * 60
        : null;

  if (!totalSeconds) return null;

  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const restMinutes = totalMinutes % 60;

    return `${hours}h ${restMinutes}min`;
  }

  return `${totalMinutes}min${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ""}`;
}

function isQuestionThread(thread: ForumThread) {
  return thread.linkable_type === "App\\Models\\Questao";
}

function isLessonThread(thread: ForumThread) {
  return thread.linkable_type === "App\\Models\\CourseContent";
}

function isGeneralThread(thread: ForumThread) {
  return !thread.linkable_type && !thread.linkable_id;
}

function getThreadTypeLabel(thread: ForumThread) {
  if (isQuestionThread(thread)) return "Questão";
  if (isLessonThread(thread)) return "Aula";
  return "Geral";
}

function getDifficultyLabel(difficulty?: number | null) {
  switch (Number(difficulty)) {
    case 1:
      return "Muito fácil";
    case 2:
      return "Fácil";
    case 3:
      return "Médio";
    case 4:
      return "Difícil";
    case 5:
      return "Muito difícil";
    default:
      return null;
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
  const initial = name.charAt(0).toUpperCase();

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

function MarkdownEditorBox({
  initialContent,
  onChange,
  editorKey,
}: {
  initialContent: string;
  onChange: (value: string) => void;
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

function QuestionMiniPreview({
  question,
}: {
  question: ForumQuestionLinkable;
}) {
  const [preview, setPreview] = useState("");

  const topicos = safeArray(question?.topicos);
  const visibleTopicos = topicos.slice(0, 4);
  const remainingTopicosCount = Math.max(
    topicos.length - visibleTopicos.length,
    0,
  );
  const difficultyLabel = getDifficultyLabel(question?.dificuldade);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const html = await processMarkdownPreview(question?.enunciado ?? "");

        if (!cancelled) {
          setPreview(html);
        }
      } catch (error) {
        console.error("Erro ao gerar preview da questão:", error);

        if (!cancelled) {
          setPreview("");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [question?.enunciado]);

  return (
    <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/[0.06] sm:p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
          Questão #{question?.id}
        </span>

        {difficultyLabel && (
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
            {difficultyLabel}
          </span>
        )}
      </div>

      {preview ? (
        <div
          className="forum-preview-katex text-sm leading-relaxed text-slate-700 dark:text-slate-200 sm:text-[15px]"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      ) : (
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 sm:text-[15px]">
          Sem prévia disponível.
        </p>
      )}

      {visibleTopicos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleTopicos.map((topico) => (
            <span
              key={topico.id}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"
            >
              {topico?.assunto?.frente?.nome
                ? `${topico.assunto.frente.nome} · ${topico.nome}`
                : topico.nome}
            </span>
          ))}

          {remainingTopicosCount > 0 && (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400">
              +{remainingTopicosCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function LessonMiniPreview({ lesson }: { lesson: ForumCourseLinkable }) {
  const duration = formatDuration(lesson?.estimated_time_minutes);

  return (
    <div className="mt-3 rounded-2xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-500/20 dark:bg-purple-500/[0.06] sm:p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-purple-700 dark:bg-purple-500/15 dark:text-purple-200">
          Aula #{lesson?.id}
        </span>

        {lesson?.content_type && (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-200">
            {lesson.content_type}
          </span>
        )}

        {duration && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
            <Clock3 className="h-3 w-3" />
            {duration}
          </span>
        )}
      </div>

      <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200 sm:text-[15px]">
        {lesson?.title ?? "Aula vinculada"}
      </p>

      {lesson?.module?.title && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Módulo: {lesson.module.title}
        </p>
      )}
    </div>
  );
}

function GeneralThreadPreview({ body }: { body: string }) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const html = await processMarkdownPreview(body ?? "");

        if (!cancelled) {
          setPreview(html);
        }
      } catch (error) {
        console.error("Erro ao gerar preview da dúvida:", error);

        if (!cancelled) {
          setPreview("");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [body]);

  if (!preview) {
    return (
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[15px]">
        Sem prévia disponível.
      </p>
    );
  }

  return (
    <div
      className="forum-preview-katex mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[15px]"
      dangerouslySetInnerHTML={{ __html: preview }}
    />
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
      className={`
        relative inline-flex min-h-10 items-center justify-center gap-1.5 overflow-hidden
        rounded-xl border px-3 py-2 text-xs font-bold transition
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          liked
            ? "border-blue-500/40 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
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

function ForumThreadCard({
  thread,
  token,
  onOpen,
}: {
  thread: ForumThread;
  token: string;
  onOpen: () => void;
}) {
  const repliesCount = Number(thread.replies_count ?? 0);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition hover:border-blue-500/30 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0B1220] dark:hover:bg-[#101A2D] sm:p-5"
      onClick={onOpen}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isQuestionThread(thread) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                <FileQuestion className="h-3.5 w-3.5" />
                Questão
              </span>
            )}

            {isLessonThread(thread) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-200">
                <GraduationCap className="h-3.5 w-3.5" />
                Aula
              </span>
            )}

            {isGeneralThread(thread) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-500/10 dark:text-slate-300">
                <BookOpen className="h-3.5 w-3.5" />
                Geral
              </span>
            )}

            <span
              className={
                thread.is_closed
                  ? "inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300"
                  : "inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700 dark:bg-green-500/10 dark:text-green-300"
              }
            >
              {thread.is_closed ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Resolvida
                </>
              ) : (
                <>
                  <MessageCircle className="h-3.5 w-3.5" />
                  Aberta
                </>
              )}
            </span>

            {repliesCount === 0 && (
              <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[11px] font-bold text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300">
                Sem resposta
              </span>
            )}

            {repliesCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                {repliesCount} {repliesCount === 1 ? "resposta" : "respostas"}
              </span>
            )}
          </div>

          <h2 className="line-clamp-2 break-words text-base font-bold leading-snug text-slate-950 dark:text-white sm:text-lg">
            {thread.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            <span className="inline-flex min-w-0 items-center gap-2">
              <ForumAuthorAvatar author={thread.author} sizeClassName="h-8 w-8" />
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

            {thread.linkable_id && (
              <>
                <span>•</span>

                <span>
                  {getThreadTypeLabel(thread)} #{thread.linkable_id}
                </span>
              </>
            )}
          </div>

          {isQuestionThread(thread) && thread.linkable && (
            <QuestionMiniPreview
              question={thread.linkable as ForumQuestionLinkable}
            />
          )}

          {isLessonThread(thread) && thread.linkable && (
            <LessonMiniPreview
              lesson={thread.linkable as ForumCourseLinkable}
            />
          )}

          {isGeneralThread(thread) && (
            <GeneralThreadPreview body={thread.body} />
          )}
        </div>

        <div
          className="mt-2 flex w-full flex-row gap-2 sm:mt-0 sm:w-auto sm:flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <ForumThreadLikeButton
            token={token}
            threadId={thread.id}
            initialLiked={Boolean(thread.liked_by_me)}
            initialCount={thread.likes_count ?? 0}
          />

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-[#0E00D0] px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 sm:flex-none"
          >
            Abrir
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-[#0B1220]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
        <MessageCircle className="h-7 w-7 text-slate-500 dark:text-slate-400" />
      </div>

      <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{title}</h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function CreateThreadModal({
  open,
  onClose,
  onCreated,
  token,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  token: string;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !body.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await api.post(
        "/forum",
        {
          title: title.trim(),
          body: body.trim(),
        },
        {
          headers: authHeaders(token),
        },
      );

      reset();
      onCreated();
      onClose();
    } catch (error: any) {
      console.error("Erro ao criar tópico:", error);

      alert(
        error?.response?.data?.message ??
          "Não foi possível criar a dúvida agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center px-3 py-6 sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Fechar modal"
            className="cursor-pointer absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/70"
            onClick={isSubmitting ? undefined : onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative z-[9999] flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0B1220]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 dark:border-white/10 sm:px-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
                  Nova discussão
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                  Criar dúvida geral
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Para dúvidas de questão ou aula, o ideal é abrir a dúvida a
                  partir da própria questão/aula.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-950 dark:text-white">
                    Título
                  </label>

                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex.: Dúvida sobre fatoração"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0E00D0] dark:border-white/10 dark:bg-[#050B1A] dark:text-white dark:placeholder:text-slate-500 sm:text-base"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-950 dark:text-white">
                    Corpo da dúvida em Markdown
                  </label>

                  <MarkdownEditorBox
                    editorKey={`new-general-thread-${open ? "open" : "closed"}`}
                    initialContent={body}
                    onChange={setBody}
                  />
                </div>
              </div>

              <footer className="grid grid-cols-1 gap-2 border-t border-slate-200 px-4 py-4 dark:border-white/10 sm:flex sm:justify-end sm:px-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="cursor-pointer inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !body.trim()}
                  className="cursor-pointer inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Criar dúvida
                    </>
                  )}
                </button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ForumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const sessionToken = useMemo(() => getTokenFromSession(session), [session]);

  const token = useMemo(() => {
    return String(sessionToken || getClientToken() || "")
      .replace(/^Bearer\s+/i, "")
      .trim();
  }, [sessionToken]);

  const initialFilter = useMemo<FilterType>(() => {
    const raw = searchParams?.get("filter") as FilterType | null;

    if (raw && filters.some((filter) => filter.value === raw)) {
      return raw;
    }

    return "all";
  }, [searchParams]);

  const initialSearch = useMemo(() => {
    return searchParams?.get("search") ?? "";
  }, [searchParams]);

  const initialPage = useMemo(() => {
    const page = Number(searchParams?.get("page") ?? 1);

    return Number.isFinite(page) && page > 0 ? page : 1;
  }, [searchParams]);

  const [threadsResponse, setThreadsResponse] =
    useState<LaravelPaginatedResponse<ForumThread> | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const threads = safeArray(threadsResponse?.data);

  const fetchThreads = useCallback(async () => {
    if (status === "loading") return;

    if (!token) {
      setErrorMessage("Usuário não autenticado. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();

      params.set("filter", activeFilter);
      params.set("page", String(currentPage));
      params.set("per_page", "20");

      if (submittedSearchTerm.trim()) {
        params.set("search", submittedSearchTerm.trim());
      }

      const response = await api.get(`/forum?${params.toString()}`, {
        headers: authHeaders(token),
      });

      setThreadsResponse(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar fórum:", error);

      setErrorMessage(
        error?.response?.data?.message ??
          "Não foi possível carregar o fórum agora.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, currentPage, status, submittedSearchTerm, token]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (activeFilter !== "all") {
      params.set("filter", activeFilter);
    }

    if (submittedSearchTerm.trim()) {
      params.set("search", submittedSearchTerm.trim());
    }

    if (currentPage > 1) {
      params.set("page", String(currentPage));
    }

    const query = params.toString();

    router.replace(query ? `/forum?${query}` : "/forum", {
      scroll: false,
    });
  }, [activeFilter, currentPage, router, submittedSearchTerm]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmittedSearchTerm(searchTerm.trim());
    setCurrentPage(1);
  }

  function handleFilterChange(filter: FilterType) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  function handleOpenThread(threadId: number) {
    router.push(`/forum/${threadId}`);
  }

  const canGoPrevious = Boolean(threadsResponse?.prev_page_url);
  const canGoNext = Boolean(threadsResponse?.next_page_url);

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4 text-slate-950 dark:bg-[#00091A] dark:text-white">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-white/10 dark:bg-[#0B1220]">
          <h1 className="text-2xl font-bold">Acesso negado</h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Você precisa estar logado para acessar o fórum.
          </p>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E00D0] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-slate-950 dark:bg-[#00091A] dark:text-white">
      <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0B1220]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-[#0E00D0] to-[#111827] px-4 py-5 dark:border-white/10 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100/80">
                  Comunidade
                </p>

                <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Fórum de dúvidas
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100/80 sm:text-base">
                  Veja dúvidas gerais, dúvidas associadas a questões e
                  discussões vinculadas a aulas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="cursor-pointer inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#0E00D0] transition hover:bg-blue-50 lg:w-auto"
              >
                <Plus className="h-4 w-4" />
                Nova dúvida
              </button>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por título, texto, autor, questão ou aula..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0E00D0] dark:border-white/10 dark:bg-[#050B1A] dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
              >
                Buscar
              </button>
            </form>

            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
              <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleFilterChange(filter.value)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-bold transition",
                      activeFilter === filter.value
                        ? "bg-[#0E00D0] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                    ].join(" ")}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-200 dark:border-white/10 dark:bg-white/10"
              />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {errorMessage}
          </div>
        ) : threads.length === 0 ? (
          <EmptyState
            title="Nenhuma dúvida encontrada"
            description="Tente mudar o filtro, limpar a busca ou criar uma nova dúvida geral."
          />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence>
              {threads.map((thread) => (
                <ForumThreadCard
                  key={thread.id}
                  thread={thread}
                  token={token}
                  onOpen={() => handleOpenThread(thread.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {threadsResponse && threadsResponse.last_page > 1 && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0B1220] sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400 sm:text-left">
              Página{" "}
              <span className="font-bold text-slate-950 dark:text-white">
                {threadsResponse.current_page}
              </span>{" "}
              de{" "}
              <span className="font-bold text-slate-950 dark:text-white">
                {threadsResponse.last_page}
              </span>{" "}
              · {threadsResponse.total} tópicos
            </p>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <button
                type="button"
                disabled={!canGoNext}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(page + 1, threadsResponse.last_page),
                  )
                }
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <CreateThreadModal
        open={isCreateModalOpen}
        token={token}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          setCurrentPage(1);
          fetchThreads();
        }}
      />
    </div>
  );
}

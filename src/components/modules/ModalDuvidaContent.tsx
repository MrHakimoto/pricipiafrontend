// components/modules/ModalDuvidaContent.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle,
  ThumbsUp,
  RefreshCw,
  UserCircle2,
} from "lucide-react";

import {
  getForumThreadDetails,
  postForumReply,
  markBestReply,
  reopenThread,
  type ForumThread,
  type ForumReply,
  type CreateThreadData,
  createForumThread,
} from "@/lib/forum/forum";

import { processMarkdown } from "@/utils/markdownProcessor";
import { toggleLike } from "@/lib/course/like";

interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

const MarkdownEditor = dynamic<MarkdownEditorProps>(
  () => import("@/components/editor/MarkDownEditor").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-[#0F172A]">
        <Loader2 className="animate-spin text-blue-500" size={24} />
      </div>
    ),
  },
);

interface ModalDuvidaProps {
  isOpen: boolean;
  onClose: () => void;
  courseContentId?: number;
  enunciado?: string;
  threadId?: string;
  modo?: "nova" | "discussao";
}

type LikeableForumReply = ForumReply & {
  likes_count?: number;
  liked_by_me?: boolean;
  is_solution?: boolean;
  author?: {
    id: number;
    name: string;
    avatar?: string | null;
  };
};

type LikeableForumThread = ForumThread & {
  likes_count?: number;
  liked_by_me?: boolean;
  replies?: LikeableForumReply[];
  author?: {
    id: number;
    name: string;
    avatar?: string | null;
  };
};

function ForumLikeButton({
  token,
  entityType,
  entityId,
  initialLiked = false,
  initialCount = 0,
  compact = false,
}: {
  token?: string;
  entityType: "duvida" | "resposta_forum";
  entityId: number;
  initialLiked?: boolean;
  initialCount?: number;
  compact?: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const disabled = !token || loading || !entityId;

  useEffect(() => {
    setLiked(initialLiked);
    setLikesCount(initialCount);
  }, [initialLiked, initialCount, entityId]);

  async function handleToggleLike(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (disabled || !token) return;

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
        entity_type: entityType,
        entity_id: entityId,
      });

      setLiked(response.liked);
      setLikesCount(response.likes_count);
    } catch (error) {
      console.error("Erro ao curtir dúvida/resposta:", error);

      setLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggleLike}
      disabled={disabled}
      aria-pressed={liked}
      title={liked ? "Remover curtida" : "Curtir"}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      className={`
        relative inline-flex items-center justify-center gap-1.5 overflow-hidden
        rounded-xl border font-bold transition disabled:cursor-not-allowed disabled:opacity-50
        ${compact ? "min-h-9 px-2.5 py-1.5 text-xs" : "min-h-10 px-3 py-2 text-xs"}
        ${
          liked
            ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
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
            ? { scale: [1, 1.22, 1], rotate: [0, -8, 8, 0] }
            : { scale: 1, rotate: 0 }
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

export const ModalDuvidaContent: React.FC<ModalDuvidaProps> = ({
  isOpen,
  onClose,
  courseContentId,
  enunciado = "Este é o conteúdo da aula...",
  threadId,
  modo = "nova",
}) => {
  const { data: session } = useSession();

  const [thread, setThread] = useState<LikeableForumThread | null>(null);
  const [currentMode, setCurrentMode] = useState<"nova" | "discussao">(modo);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    threadId,
  );

  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [processingContent, setProcessingContent] = useState(false);
  const [threadHtml, setThreadHtml] = useState("");
  const [repliesHtml, setRepliesHtml] = useState<Record<number, string>>({});
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const token = session?.laravelToken;
  const user = session?.user;

  const isAuthor =
    thread?.author?.id != null &&
    user?.id != null &&
    String(user.id) === String(thread.author.id);

  useEffect(() => {
    if (!isOpen) return;

    setCurrentMode(modo);
    setCurrentThreadId(threadId);

    if (modo === "discussao" && threadId && token) {
      carregarThread(threadId);
      return;
    }

    setThread(null);
    setThreadHtml("");
    setRepliesHtml({});
    setLoading(false);
  }, [isOpen, threadId, modo, token]);

  useEffect(() => {
    if (thread) {
      processThreadContent();
    }
  }, [thread]);

  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.tagName === "IMG") {
        const src = target.getAttribute("src");

        if (src) {
          setZoomedImageUrl(src);
        }
      }
    };

    if (isOpen && (threadHtml || Object.keys(repliesHtml).length > 0)) {
      document.addEventListener("click", handleImageClick);
    }

    return () => {
      document.removeEventListener("click", handleImageClick);
    };
  }, [isOpen, threadHtml, repliesHtml]);

  async function carregarThread(id = currentThreadId) {
    if (!token || !id) return;

    setLoading(true);

    try {
      const data = await getForumThreadDetails(token, id);
      setThread(data as LikeableForumThread);
    } catch (error) {
      console.error("Erro ao carregar thread:", error);
    } finally {
      setLoading(false);
    }
  }

  async function processThreadContent() {
    if (!thread) return;

    setProcessingContent(true);

    try {
      const processedThread = await processMarkdown(thread.body ?? "");
      setThreadHtml(processedThread);

      const repliesHtmlMap: Record<number, string> = {};

      if (thread.replies?.length) {
        for (const reply of thread.replies) {
          const processedReply = await processMarkdown(reply.body ?? "");
          repliesHtmlMap[reply.id] = processedReply;
        }
      }

      setRepliesHtml(repliesHtmlMap);
    } catch (error) {
      console.error("Erro ao processar conteúdo Markdown:", error);
    } finally {
      setProcessingContent(false);
    }
  }

  async function handleEnviarDuvida() {
    if (!mensagem.trim() || !token || !courseContentId || !user) {
      alert("Preencha sua dúvida antes de enviar.");
      return;
    }

    setEnviando(true);

    try {
      const threadData: CreateThreadData = {
        title: `Dúvida na Aula #${courseContentId}`,
        body: mensagem,
        linkable_type: "CourseContent",
        linkable_id: courseContentId,
      };

      const novaThread = (await createForumThread(
        token,
        threadData,
      )) as LikeableForumThread;

      setMensagem("");
      setEditorKey((prev) => prev + 1);
      setThread(novaThread);
      setCurrentThreadId(String(novaThread.id));
      setCurrentMode("discussao");
    } catch (error) {
      console.error("Erro ao enviar dúvida:", error);
      alert("Erro ao enviar dúvida. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function handlePostReply(event: React.FormEvent) {
    event.preventDefault();

    if (!mensagem.trim() || !token || !thread) return;

    setEnviando(true);

    try {
      await postForumReply(token, thread.id, mensagem);

      setMensagem("");
      setEditorKey((prev) => prev + 1);

      await carregarThread(String(thread.id));
    } catch (error) {
      console.error("Erro ao postar resposta:", error);
    } finally {
      setEnviando(false);
    }
  }

  async function handleMarkBestReply(replyId: number) {
    if (!token || !thread) return;

    setActionLoading(`mark-${replyId}`);

    try {
      await markBestReply(token, thread.id, replyId);
      await carregarThread(String(thread.id));
    } catch (error) {
      console.error("Erro ao marcar melhor resposta:", error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReopenThread() {
    if (!token || !thread) return;

    setActionLoading("reopen");

    try {
      await reopenThread(token, thread.id);
      await carregarThread(String(thread.id));
    } catch (error) {
      console.error("Erro ao reabrir thread:", error);
    } finally {
      setActionLoading(null);
    }
  }

  function formatarData(dataString?: string) {
    if (!dataString) return "";

    return new Date(dataString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleClose() {
    setZoomedImageUrl(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(event) => event.stopPropagation()}
            className="
              flex max-h-[92vh] w-[96vw] max-w-5xl flex-col overflow-hidden
              rounded-2xl border border-white/10 bg-[#0B1220] shadow-2xl
              sm:w-[92vw]
            "
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                  <MessageCircle size={22} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-white sm:text-lg">
                    {currentMode === "nova"
                      ? "Tire sua dúvida"
                      : "Discussão da dúvida"}
                  </h2>

                  <p className="truncate text-xs text-gray-400 sm:text-sm">
                    {currentMode === "nova"
                      ? "Nossa equipe de especialistas vai te ajudar"
                      : courseContentId
                        ? `Aula #${courseContentId}`
                        : "Dúvida vinculada à aula"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex min-h-[360px] items-center justify-center p-6">
                  <div className="text-center">
                    <Loader2
                      className="mx-auto mb-3 animate-spin text-blue-500"
                      size={32}
                    />
                    <p className="text-sm text-gray-400">
                      Carregando discussão...
                    </p>
                  </div>
                </div>
              ) : currentMode === "nova" ? (
                <div className="space-y-4 p-3 sm:p-6">
                  <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3 sm:p-5">
                    <h3 className="mb-2 text-sm font-bold text-white sm:text-base">
                      Aula #{courseContentId}
                    </h3>

                    <p className="line-clamp-4 text-sm leading-relaxed text-gray-300">
                      {enunciado.replace(/<[^>]*>/g, "").substring(0, 260)}
                      {enunciado.length > 260 ? "..." : ""}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3 sm:p-5">
                    <label className="mb-2 block text-sm font-bold text-white">
                      Sua dúvida *
                    </label>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050B1A]">
                      <MarkdownEditor
                        key={`nova-duvida-${editorKey}`}
                        initialContent={mensagem}
                        onChange={(content) => setMensagem(content ?? "")}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-yellow-700/50 bg-yellow-900/20 p-3">
                      <div className="mb-1 flex items-center gap-2 text-sm font-bold text-yellow-300">
                        <span>💡</span>
                        Dicas para uma boa pergunta
                      </div>

                      <ul className="space-y-1 text-xs text-yellow-100/90">
                        <li>• Seja específico sobre o que não entendeu.</li>
                        <li>• Mencione o passo onde teve dificuldade.</li>
                        <li>• Compartilhe seu raciocínio atual.</li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={handleEnviarDuvida}
                      disabled={!mensagem.trim() || enviando}
                      className="
                        mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2
                        rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white
                        transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-600
                      "
                    >
                      {enviando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar dúvida
                        </>
                      )}
                    </button>

                    <div className="mt-4 text-center text-xs text-gray-400">
                      <p>⌛ Resposta em até 24 horas</p>
                      <p>Resposta por especialistas da matéria</p>
                    </div>
                  </div>
                </div>
              ) : thread ? (
                <div className="space-y-4 p-3 sm:p-6">
                  <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`
                              rounded-full px-2.5 py-1 text-[11px] font-bold
                              ${
                                thread.is_closed
                                  ? "bg-green-500/15 text-green-300"
                                  : "bg-blue-500/15 text-blue-300"
                              }
                            `}
                          >
                            {thread.is_closed ? "Resolvida" : "Aberta"}
                          </span>

                          {thread.best_reply_id && (
                            <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-bold text-green-300">
                              Melhor resposta marcada
                            </span>
                          )}
                        </div>

                        <h3 className="break-words text-lg font-bold leading-tight text-white sm:text-2xl">
                          {thread.title}
                        </h3>
                      </div>

                      {isAuthor && thread.is_closed && (
                        <button
                          type="button"
                          onClick={handleReopenThread}
                          disabled={actionLoading === "reopen"}
                          className="
                            inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl
                            border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-bold
                            text-green-200 transition hover:bg-green-500/20 disabled:opacity-50
                          "
                        >
                          {actionLoading === "reopen" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Reabrir
                        </button>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-[#050B1A]/70 p-3 sm:p-4">
                      {processingContent && !threadHtml ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processando conteúdo...
                        </div>
                      ) : (
                        <div
                          className="
                            markdown-body wmde-markdown wmde-markdown-color
                            max-w-none text-sm leading-relaxed text-gray-200
                            [&_img]:my-3 [&_img]:max-h-[70vh] [&_img]:cursor-zoom-in
                            [&_img]:rounded-xl [&_img]:border [&_img]:border-white/10
                          "
                          dangerouslySetInnerHTML={{ __html: threadHtml }}
                        />
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-gray-400 sm:text-sm">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5">
                          {thread.author?.avatar ? (
                            <img
                              src={thread.author.avatar}
                              alt={thread.author.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircle2 className="h-4 w-4 text-slate-400" />
                          )}
                        </div>

                        <span className="truncate">
                          Por {thread.author?.name ?? "Usuário"}
                        </span>
                        <span>•</span>
                        <span className="shrink-0">
                          {formatarData(thread.created_at)}
                        </span>
                      </div>

                      <ForumLikeButton
                        token={token}
                        entityType="duvida"
                        entityId={thread.id}
                        initialLiked={Boolean(thread.liked_by_me)}
                        initialCount={thread.likes_count ?? 0}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h4 className="text-base font-bold text-white sm:text-lg">
                          Respostas
                        </h4>

                        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                          Acompanhe a discussão desta dúvida.
                        </p>
                      </div>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                        {thread.replies?.length || 0}
                      </span>
                    </div>

                    {thread.replies?.length ? (
                      <div className="space-y-3">
                        {thread.replies.map((reply, index) => {
                          const isBestReply =
                            thread.best_reply_id === reply.id ||
                            Boolean(reply.is_solution);

                          return (
                            <motion.div
                              key={reply.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.22,
                                delay: Math.min(index * 0.04, 0.2),
                              }}
                              className={`
                                rounded-2xl border p-3 sm:p-5
                                ${
                                  isBestReply
                                    ? "border-green-500/40 bg-green-500/10"
                                    : "border-white/10 bg-[#0F172A]"
                                }
                              `}
                            >
                              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                                    {reply.author?.avatar ? (
                                      <img
                                        src={reply.author.avatar}
                                        alt={reply.author.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <UserCircle2 className="h-5 w-5 text-slate-400" />
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="max-w-[190px] truncate font-semibold text-white sm:max-w-none">
                                        {reply.author?.name ?? "Usuário"}
                                      </p>

                                      {isBestReply && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-[11px] font-bold text-green-200">
                                          <CheckCircle className="h-3.5 w-3.5" />
                                          Melhor resposta
                                        </span>
                                      )}
                                    </div>

                                    <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                                      {formatarData(reply.created_at)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div
                                className="
                                  markdown-body wmde-markdown wmde-markdown-color
                                  rounded-2xl border border-white/5 bg-white/[0.02] p-3
                                  text-sm leading-relaxed text-gray-200 sm:p-4
                                  [&_img]:my-3 [&_img]:max-h-[70vh] [&_img]:cursor-zoom-in
                                  [&_img]:rounded-xl [&_img]:border [&_img]:border-white/10
                                "
                                dangerouslySetInnerHTML={{
                                  __html: repliesHtml[reply.id] ?? "",
                                }}
                              />

                              <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                <ForumLikeButton
                                  token={token}
                                  entityType="resposta_forum"
                                  entityId={reply.id}
                                  initialLiked={Boolean(reply.liked_by_me)}
                                  initialCount={reply.likes_count ?? 0}
                                  compact
                                />

                                {isAuthor &&
                                  !thread.is_closed &&
                                  !isBestReply && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMarkBestReply(reply.id)
                                      }
                                      disabled={
                                        actionLoading === `mark-${reply.id}`
                                      }
                                      className="
                                        inline-flex min-h-9 items-center justify-center gap-1 rounded-xl
                                        border border-green-500/30 bg-green-500/10 px-3 py-2
                                        text-xs font-bold text-green-200 transition hover:bg-green-500/20
                                        disabled:opacity-50
                                      "
                                    >
                                      {actionLoading === `mark-${reply.id}` ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      )}
                                      Melhor resposta
                                    </button>
                                  )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-[#0F172A] p-6 text-center">
                        <MessageCircle className="mx-auto h-7 w-7 text-slate-500" />
                        <p className="mt-3 text-sm font-semibold text-slate-300">
                          Ainda não há respostas.
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Seja o primeiro a contribuir com uma explicação.
                        </p>
                      </div>
                    )}
                  </div>

                  {!thread.is_closed && (
                    <form
                      onSubmit={handlePostReply}
                      className="rounded-2xl border border-white/10 bg-[#0F172A] p-3 sm:p-5"
                    >
                      <div className="mb-3">
                        <label className="block text-sm font-bold text-white">
                          Responder
                        </label>

                        <p className="mt-1 text-xs text-slate-500">
                          Use Markdown para fórmulas, imagens e explicações
                          completas.
                        </p>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050B1A]">
                        <MarkdownEditor
                          key={`reply-${thread.id}-${editorKey}`}
                          initialContent={mensagem}
                          onChange={(content) => setMensagem(content ?? "")}
                        />
                      </div>

                      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-center text-[11px] text-slate-500 sm:text-left">
                          Respostas boas são claras, diretas e mostram o
                          raciocínio.
                        </p>

                        <button
                          type="submit"
                          disabled={enviando || !mensagem.trim()}
                          className="
                            inline-flex min-h-11 w-full items-center justify-center gap-2
                            rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-bold text-white
                            transition hover:bg-blue-700 disabled:cursor-not-allowed
                            disabled:opacity-50 sm:w-auto
                          "
                        >
                          {enviando ? (
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
                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-200">
                      Esta dúvida foi marcada como resolvida. O autor pode
                      reabrir a discussão se necessário.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center p-6 text-center">
                  <div>
                    <MessageCircle className="mx-auto mb-3 h-8 w-8 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-300">
                      Não foi possível carregar esta dúvida.
                    </p>
                    <button
                      type="button"
                      onClick={() => carregarThread()}
                      className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {zoomedImageUrl && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setZoomedImageUrl(null)}
          >
            <button
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Fechar imagem"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.img
              src={zoomedImageUrl}
              alt="Imagem ampliada"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[88vh] max-w-[96vw] rounded-2xl object-contain"
              onMouseDown={(event) => event.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
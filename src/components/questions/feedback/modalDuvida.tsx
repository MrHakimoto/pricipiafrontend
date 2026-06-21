// components/questions/feedback/modalDuvida.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
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
import {
  X,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { AnimatedRoleName } from "@/components/user/AnimatedRoleName";
import { processMarkdown } from "@/utils/markdownProcessor";
import MarkdownEditor from "@/components/editor/MarkDownEditor";

interface ModalDuvidaProps {
  isOpen: boolean;
  onClose: () => void;
  questaoId?: number;
  enunciado?: string;
  threadId?: string;
  modo?: "nova" | "discussao";
}
import { getLevelTitle } from "@/lib/gamification/levels";
type NotificationType = "success" | "error" | "warning";

type NotificationState = {
  type: NotificationType;
  message: string;
} | null;

function getAuthorRoles(author: any) {
  if (!Array.isArray(author?.roles)) return [];

  return [...author.roles].sort(
    (a, b) => Number(b?.priority ?? 0) - Number(a?.priority ?? 0),
  );
}

function getAuthorPrimaryRole(author: any) {
  const roles = getAuthorRoles(author);
  return author?.role ?? roles[0] ?? null;
}

function getAuthorLevel(author: any) {
  return Number(author?.gamification?.current_level ?? 1);
}

function getAuthorLevelTitle(author: any) {
  return (
    author?.gamification?.level_title ??
    getLevelTitle(author?.gamification?.current_level ?? 1)
  );
}

function MarkdownPreview({
  content,
  className = "",
  clamp = false,
}: {
  content: string;
  className?: string;
  clamp?: boolean;
}) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const processed = await processMarkdown(content ?? "");

        if (!cancelled) {
          setHtml(processed);
        }
      } catch (error) {
        console.error("Erro ao processar markdown:", error);

        if (!cancelled) {
          setHtml(content ?? "");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div
      className={[
        "markdown-body wmde-markdown wmde-markdown-color break-words text-gray-700 dark:text-gray-300",
        clamp ? "line-clamp-4" : "",
        className,
      ].join(" ")}
      style={
        {
          "--color-canvas-default": "transparent",
          "--color-fg-default": "currentColor",
        } as React.CSSProperties
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export const ModalDuvida: React.FC<ModalDuvidaProps> = ({
  isOpen,
  onClose,
  questaoId,
  enunciado = "",
  threadId,
  modo = "nova",
}) => {
  const [mensagem, setMensagem] = useState("");
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>(null);

  const { data: session } = useSession();

  const sessionAny = session as any;
  const token = sessionAny?.laravelToken;
  const user = sessionAny?.user;

  useEffect(() => {
    if (isOpen && modo === "discussao" && threadId && token) {
      carregarThread();
    }

    if (isOpen && modo === "nova") {
      setThread(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, modo, threadId, token]);

  useEffect(() => {
    if (!notification) return;

    const timeout = window.setTimeout(() => {
      setNotification(null);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [notification]);

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message });
  };

  const carregarThread = async () => {
    if (!token || !threadId) return;

    setLoading(true);

    try {
      const threadData = await getForumThreadDetails(token, threadId);
      setThread(threadData);
    } catch (error) {
      console.error("Erro ao carregar discussão:", error);
      showNotification("error", "Erro ao carregar discussão.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async () => {
    if (!mensagem.trim() || !token || !questaoId || !user) {
      showNotification("warning", "Preencha sua dúvida antes de enviar.");
      return;
    }

    setEnviando(true);

    try {
      const threadData: CreateThreadData = {
        title: `Dúvida na Questão #${questaoId}`,
        body: mensagem.trim(),
        linkable_type: "Questao",
        linkable_id: questaoId,
      };

      const novaThread = await createForumThread(token, threadData);

      setMensagem("");
      setThread(novaThread);
      showNotification("success", "Dúvida enviada com sucesso.");
    } catch (error) {
      console.error("Erro ao enviar dúvida:", error);
      showNotification("error", "Erro ao enviar dúvida. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handlePostReply = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!mensagem.trim() || !token || !thread?.id) {
      showNotification("warning", "Escreva uma resposta antes de publicar.");
      return;
    }

    setEnviando(true);

    try {
      await postForumReply(token, String(thread.id), mensagem.trim());
      setMensagem("");
      await carregarThread();
      showNotification("success", "Resposta publicada com sucesso.");
    } catch (error) {
      console.error("Erro ao publicar resposta:", error);
      showNotification("error", "Erro ao publicar resposta. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handleMarkBestReply = async (replyId: number) => {
    if (!token || !thread?.id) return;

    setActionLoading(`mark-${replyId}`);

    try {
      await markBestReply(token, String(thread.id), replyId);
      await carregarThread();
      showNotification("success", "Melhor resposta marcada com sucesso.");
    } catch (error) {
      console.error("Erro ao marcar melhor resposta:", error);
      showNotification("error", "Erro ao marcar melhor resposta.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenThread = async () => {
    if (!token || !thread?.id) return;

    setActionLoading("reopen");

    try {
      await reopenThread(token, String(thread.id));
      await carregarThread();
      showNotification("success", "Discussão reaberta com sucesso.");
    } catch (error) {
      console.error("Erro ao reabrir discussão:", error);
      showNotification("error", "Erro ao reabrir discussão.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatarData = (dataString?: string) => {
    if (!dataString) return "";

    return new Date(dataString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAuthor = Boolean(
    user?.id && thread?.author?.id && Number(user.id) === Number(thread.author.id),
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 dark:bg-black/70"
          onClick={onClose}
        >
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className={[
                  "fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur",
                  notification.type === "success"
                    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/40 dark:bg-green-950/80 dark:text-green-100"
                    : notification.type === "error"
                      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/80 dark:text-red-100"
                      : "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-950/80 dark:text-yellow-100",
                ].join(" ")}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {notification.type === "success" ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                </div>

                <p className="text-sm font-medium leading-relaxed">
                  {notification.message}
                </p>

                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="ml-1 rounded-md p-1 opacity-70 transition hover:bg-slate-100 hover:opacity-100 dark:hover:bg-white/10"
                  aria-label="Fechar notificação"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#00091A]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#F8F8F8] px-6 py-4 dark:border-gray-800 dark:bg-[#1B1F27]">
              <div className="flex items-center gap-3">
                <MessageCircle className="text-blue-500" size={24} />

                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    {modo === "nova"
                      ? "Tire sua Dúvida"
                      : "Discussão da Dúvida"}
                  </h2>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {modo === "nova"
                      ? "Nossa equipe de especialistas vai te ajudar"
                      : `Questão #${questaoId}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : modo === "nova" || !thread ? (
                <div className="p-6">
                  <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#131b2d]">
                    <h4 className="mb-2 font-medium text-gray-950 dark:text-white">
                      Questão #{questaoId}
                    </h4>

                    <MarkdownPreview
                      content={enunciado}
                      clamp
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-950 dark:text-white">
                        Sua Dúvida *
                      </label>

                      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-[#4A5260] dark:bg-[#0F172A]">
                        <MarkdownEditor
                          initialContent={mensagem}
                          onChange={(content: string) =>
                            setMensagem(content ?? "")
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900/20">
                      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        <span>💡</span>
                        Dicas para uma boa pergunta:
                      </div>

                      <ul className="space-y-1 text-xs text-yellow-800 dark:text-yellow-200">
                        <li>• Seja específico sobre o que não entendeu</li>
                        <li>• Mencione o passo onde tem dificuldade</li>
                        <li>• Compartilhe seu raciocínio atual</li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateThread}
                      disabled={!mensagem.trim() || enviando}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
                    >
                      {enviando ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Enviar Dúvida
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    <p>⌛ Resposta em até 24 horas</p>
                    <p>Resposta por especialistas da matéria</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 p-6">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-[#2F3541] dark:bg-[#0F172A]">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white dark:border-[#2F3541] dark:bg-[#1B1F27]">
                          {(thread as any).author?.avatar ? (
                            <img
                              src={(thread as any).author.avatar}
                              alt={(thread as any).author.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {((thread as any).author?.name ?? "U")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h2 className="break-words text-xl font-bold text-gray-950 dark:text-white">
                            {thread.title}
                          </h2>

                          <div className="flex gap-2">
                            {thread.is_closed && (
                              <span className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-300">
                                Resolvida
                              </span>
                            )}

                            {thread.best_reply_id && (
                              <span className="rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-sm text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-300">
                                Melhor resposta selecionada
                              </span>
                            )}
                          </div>
                        </div>

                        <MarkdownPreview
                          content={thread.body}
                          className="text-sm leading-relaxed"
                        />

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            Por{" "}
                            <AnimatedRoleName
                              name={(thread as any).author?.name ?? "Usuário"}
                              roles={getAuthorRoles((thread as any).author)}
                              role={getAuthorPrimaryRole(
                                (thread as any).author,
                              )}
                              level={getAuthorLevel((thread as any).author)}
                              levelTitle={getAuthorLevelTitle(
                                (thread as any).author,
                              )}
                              nameClassName="text-sm"
                            />
                          </span>

                          <span>•</span>

                          <span>{formatarData(thread.created_at)}</span>

                          {thread.linkable_id && (
                            <>
                              <span>•</span>

                              <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 dark:border-[#2F3541] dark:bg-[#1B1F27]">
                                Questão #{thread.linkable_id}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isAuthor && thread.is_closed && (
                      <div className="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-[#2F3541]">
                        <button
                          type="button"
                          onClick={handleReopenThread}
                          disabled={actionLoading === "reopen"}
                          className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-700 transition-colors hover:bg-yellow-100 disabled:opacity-50 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-300 dark:hover:bg-yellow-500/30"
                        >
                          {actionLoading === "reopen"
                            ? "Reabrindo..."
                            : "Reabrir Discussão"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="border-b border-gray-200 pb-3 text-lg font-semibold text-gray-950 dark:border-[#2F3541] dark:text-white">
                      Respostas ({thread.replies?.length || 0})
                    </h3>

                    <AnimatePresence>
                      {thread.replies?.map(
                        (reply: ForumReply, index: number) => {
                          const replyAny = reply as any;

                          return (
                            <motion.div
                              key={reply.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className={`rounded-xl border p-6 ${
                                reply.id === thread.best_reply_id
                                  ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/5"
                                  : "border-gray-200 bg-white dark:border-[#2F3541] dark:bg-[#0F172A]"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border ${
                                      reply.id === thread.best_reply_id
                                        ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/20"
                                        : "border-gray-200 bg-gray-50 dark:border-[#2F3541] dark:bg-[#1B1F27]"
                                    }`}
                                  >
                                    {replyAny.author?.avatar ? (
                                      <img
                                        src={replyAny.author.avatar}
                                        alt={replyAny.author.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span
                                        className={`text-sm font-semibold ${
                                          reply.id === thread.best_reply_id
                                            ? "text-yellow-700 dark:text-yellow-300"
                                            : "text-gray-700 dark:text-gray-300"
                                        }`}
                                      >
                                        {(replyAny.author?.name ?? "U")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <AnimatedRoleName
                                      name={replyAny.author?.name ?? "Usuário"}
                                      roles={getAuthorRoles(replyAny.author)}
                                      role={getAuthorPrimaryRole(
                                        replyAny.author,
                                      )}
                                      level={getAuthorLevel(replyAny.author)}
                                      levelTitle={getAuthorLevelTitle(
                                        replyAny.author,
                                      )}
                                      nameClassName="text-sm"
                                    />

                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      • {formatarData(reply.created_at)}
                                    </span>

                                    {reply.id === thread.best_reply_id && (
                                      <span className="flex items-center gap-1 rounded border border-yellow-300 bg-yellow-50 px-2 py-1 text-xs text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-300">
                                        <CheckCircle size={12} />
                                        Melhor resposta
                                      </span>
                                    )}
                                  </div>

                                  <MarkdownPreview
                                    content={reply.body}
                                    className="text-sm leading-relaxed"
                                  />

                                  {isAuthor &&
                                    !thread.is_closed &&
                                    reply.id !== thread.best_reply_id && (
                                      <div className="mt-4 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleMarkBestReply(reply.id)
                                          }
                                          disabled={
                                            actionLoading === `mark-${reply.id}`
                                          }
                                          className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30"
                                        >
                                          {actionLoading === `mark-${reply.id}`
                                            ? "Marcando..."
                                            : "Marcar como Melhor Resposta"}
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        },
                      )}
                    </AnimatePresence>
                  </div>

                  {!thread.is_closed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-[#2F3541] dark:bg-[#0F172A]"
                    >
                      <h3 className="mb-4 text-lg font-semibold text-gray-950 dark:text-white">
                        Sua Resposta
                      </h3>

                      <form onSubmit={handlePostReply} className="space-y-4">
                        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-[#4A5260] dark:bg-[#00091A]">
                          <MarkdownEditor
                            initialContent={mensagem}
                            onChange={(content: string) =>
                              setMensagem(content ?? "")
                            }
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={enviando || !mensagem.trim()}
                            className="rounded-lg bg-[#0E00D0] px-6 py-3 text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {enviando ? "Publicando..." : "Publicar Resposta"}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {thread.is_closed && (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600 dark:text-green-500" />
                      <h3 className="mb-2 text-lg font-semibold text-green-700 dark:text-green-400">
                        Dúvida Resolvida
                      </h3>
                      <p>
                        Esta discussão foi marcada como resolvida pelo autor.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
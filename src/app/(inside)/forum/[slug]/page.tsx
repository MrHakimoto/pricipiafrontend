"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ImageLightbox } from "@/components/editor/ImageLightbox";
import { useSession } from "next-auth/react";
import {
  getForumThreadDetails,
  postForumReply,
  markBestReply,
  reopenThread,
  closeForumThread,
  updateForumThread,
  updateForumReply,
  deleteForumThread,
  deleteForumReply,
  type ForumThread,
  type ForumReply,
  type CourseContent,
} from "@/lib/forum/forum";
import { processMarkdown } from "@/utils/markdownProcessor";
import MarkdownEditor from "@/components/editor/MarkDownEditor";

const ThreadDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [processingContent, setProcessingContent] = useState(false);
  const [threadHtml, setThreadHtml] = useState<string>("");
  const [repliesHtml, setRepliesHtml] = useState<Record<number, string>>({});
  const [editingThread, setEditingThread] = useState(false);
  const [editThreadTitle, setEditThreadTitle] = useState("");
  const [editThreadBody, setEditThreadBody] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "thread" | "reply" | null;
    replyId?: number;
  }>({
    open: false,
    type: null,
  });

  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editReplyBody, setEditReplyBody] = useState("");
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const threadId = params.slug as string;

  const loadThread = async () => {
    if (!session?.laravelToken) return;

    setLoading(true);
    try {
      const data = await getForumThreadDetails(session.laravelToken, threadId);
      setThread(data);
    } catch (error) {
      console.error("Erro ao carregar thread:", error);
    } finally {
      setLoading(false);
    }
  };

  // Efeito 1: Carregar o thread
useEffect(() => {
  if (status === "authenticated" && session?.laravelToken && threadId) {
    loadThread();
  }
}, [status, session?.laravelToken, threadId]);

  // Efeito para lidar com clique em imagens
  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Verificar se o clique foi em uma imagem
      if (target.tagName === "IMG") {
        // Verificar se NÃO está em um menu do usuário, notificações, ou nav
        const isInUserMenu =
          target.closest('[class*="UserMenu"]') ||
          target.closest('[class*="user-menu"]') ||
          target.closest('[class*="notification"]') ||
          target.closest("nav") ||
          target.closest("button") ||
          target.closest('[role="menu"]') ||
          target.closest('[role="dialog"]');

        // Verificar se está no conteúdo do fórum (thread ou respostas)
        const isInForumContent =
          target.closest(".markdown-body") ||
          target.closest('[class*="thread"]') ||
          target.closest('[class*="reply"]') ||
          target.closest('[class*="forum"]');

        // Só abrir lightbox se estiver no conteúdo do fórum e NÃO em um menu
        if (isInForumContent && !isInUserMenu) {
          const src = target.getAttribute("src");
          if (src) {
            setZoomedImageUrl(src);
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    };

    // Usar capture: true para pegar o evento antes dos menus
    document.addEventListener("click", handleImageClick, true);

    return () => {
      document.removeEventListener("click", handleImageClick, true);
    };
  }, []);

  // Efeito 2: Processar o conteúdo sempre que o thread mudar
  useEffect(() => {
    if (thread) {
      processThreadContent();
    }
  }, [thread]);

  const processThreadContent = async () => {
    if (!thread) return;

    setProcessingContent(true);
    try {
      // Processar o conteúdo da thread principal
      const processedThread = await processMarkdown(thread.body);
      setThreadHtml(processedThread);

      // Processar o conteúdo de cada resposta
      const repliesHtmlMap: Record<number, string> = {};
      if (thread.replies?.length) {
        for (const reply of thread.replies) {
          const processedReply = await processMarkdown(reply.body);
          repliesHtmlMap[reply.id] = processedReply;
        }
      }
      setRepliesHtml(repliesHtmlMap);
    } catch (error) {
      console.error("Erro ao processar conteúdo Markdown:", error);
    } finally {
      setProcessingContent(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !session?.laravelToken) return;

    setPosting(true);
    try {
      await postForumReply(session.laravelToken, threadId, replyBody);
      setReplyBody("");
      await loadThread();
    } catch (error) {
      console.error("Erro ao postar resposta:", error);
    } finally {
      setPosting(false);
    }
  };

  const handleMarkBestReply = async (replyId: number) => {
    if (!session?.laravelToken) return;

    setActionLoading(`mark-${replyId}`);
    try {
      await markBestReply(session.laravelToken, threadId, replyId);
      await loadThread();
    } catch (error) {
      console.error("Erro ao marcar melhor resposta:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenThread = async () => {
    if (!session?.laravelToken) return;

    setActionLoading("reopen");
    try {
      await reopenThread(session.laravelToken, threadId);
      await loadThread();
    } catch (error) {
      console.error("Erro ao reabrir thread:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteThreadModal = () => {
  setDeleteModal({
    open: true,
    type: "thread",
  });
};

const openDeleteReplyModal = (replyId: number) => {
  setDeleteModal({
    open: true,
    type: "reply",
    replyId,
  });
};

const closeDeleteModal = () => {
  setDeleteModal({
    open: false,
    type: null,
  });
};


  const handleCloseThread = async () => {
    if (!session?.laravelToken) return;

    setActionLoading("close");

    try {
      await closeForumThread(session.laravelToken, threadId);
      await loadThread();
    } catch (error) {
      console.error("Erro ao fechar tópico:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const startEditThread = () => {
    if (!thread) return;

    setEditThreadTitle(thread.title);
    setEditThreadBody(thread.body);
    setEditingThread(true);
  };

  const cancelEditThread = () => {
    setEditingThread(false);
    setEditThreadTitle("");
    setEditThreadBody("");
  };

  const handleUpdateThread = async () => {
    if (!session?.laravelToken || !thread) return;

    setActionLoading("edit-thread");

    try {
      await updateForumThread(session.laravelToken, threadId, {
        title: editThreadTitle,
        body: editThreadBody,
      });

      setEditingThread(false);
      setEditThreadTitle("");
      setEditThreadBody("");
      await loadThread();
    } catch (error) {
      console.error("Erro ao editar tópico:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const startEditReply = (reply: ForumReply) => {
    setEditingReplyId(reply.id);
    setEditReplyBody(reply.body);
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyBody("");
  };

  const handleUpdateReply = async (replyId: number) => {
    if (!session?.laravelToken) return;

    setActionLoading(`edit-reply-${replyId}`);

    try {
      await updateForumReply(
        session.laravelToken,
        threadId,
        replyId,
        editReplyBody,
      );

      setEditingReplyId(null);
      setEditReplyBody("");
      await loadThread();
    } catch (error) {
      console.error("Erro ao editar resposta:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!session?.laravelToken || !deleteModal.type) return;

    if (deleteModal.type === "thread") {
      setActionLoading("delete-thread");

      try {
        await deleteForumThread(session.laravelToken, threadId);
        closeDeleteModal();
        router.push("/forum");
      } catch (error) {
        console.error("Erro ao apagar dúvida:", error);
      } finally {
        setActionLoading(null);
      }

      return;
    }

    if (deleteModal.type === "reply" && deleteModal.replyId) {
      const replyId = deleteModal.replyId;

      setActionLoading(`delete-reply-${replyId}`);

      try {
        await deleteForumReply(session.laravelToken, threadId, replyId);
        closeDeleteModal();
        await loadThread();
      } catch (error) {
        console.error("Erro ao apagar resposta:", error);
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Verificar autenticação
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#00091A] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-400 mb-6">
            Você precisa estar logado para ver esta discussão.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-[#0E00D0] hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#00091A] text-white">
        <div className="animate-pulse">
          <div className="h-20 bg-[#1B1F27]"></div>
          <div className="container mx-auto px-4 lg:px-40 py-8 space-y-6">
            <div className="h-8 bg-[#1B1F27] rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[#1B1F27] rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-[#00091A] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tópico não encontrado</h1>
          <button
            onClick={() => router.push("/forum")}
            className="bg-[#0E00D0] hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            Voltar ao Fórum
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = session?.user?.id === thread.author.id.toString();
  const linkable = thread.linkable as CourseContent | null;

  // Função para formatar a duração
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min ${remainingSeconds > 0 ? `${remainingSeconds}s` : ""}`;
  };

  return (
    <div className="min-h-screen bg-[#00091A] text-white">
      {/* Header */}
      <div className="px-8 py-6 border-gray-700 bg-[#1B1F27]">
        <div className="container mx-auto">
          <button
            onClick={() => router.push("/forum")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <motion.div
              whileHover={{ x: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </motion.div>
            Voltar para o Fórum
          </button>

          <h1 className="text-lg font-bold">Discussão da Dúvida</h1>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 lg:px-40 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Tópico Principal - Estilo igual às respostas */}
          <div
            className={`border rounded-xl p-6 bg-[#0F172A] ${thread.best_reply_id ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-transparent relative overflow-hidden" : "border-[#2F3541]"}`}
          >
            {thread.best_reply_id && (
              <div className="absolute top-0 right-0">
                <div className="bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MELHOR RESPOSTA
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              {/* Autor - Estilo igual às respostas */}
              <div className="flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    thread.best_reply_id
                      ? "border-yellow-500 bg-yellow-500/20"
                      : "border-[#2F3541] bg-[#1B1F27]"
                  }`}
                >
                  {thread.author.avatar ? (
                    <img
                      src={thread.author.avatar}
                      alt={thread.author.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span
                      className={`text-base font-bold ${
                        thread.best_reply_id
                          ? "text-yellow-300"
                          : "text-gray-300"
                      }`}
                    >
                      {thread.author.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h4 className="font-bold text-white">{thread.author.name}</h4>

                  <span className="text-sm text-gray-400">
                    {new Date(thread.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* Botão Reabrir (se autor) */}
                  {isAuthor && (
                    <div className="ml-auto flex items-center gap-2">
                      {!thread.is_closed && (
                        <>
                          <button
                            onClick={startEditThread}
                            disabled={editingThread}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 transition-colors text-xs"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                            Editar
                          </button>

                          <button
                            onClick={handleCloseThread}
                            disabled={actionLoading === "close"}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 transition-colors text-xs"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {actionLoading === "close"
                              ? "Fechando..."
                              : "Fechar"}
                          </button>

                          <button
                            onClick={openDeleteThreadModal}
                            disabled={actionLoading === "delete-thread"}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-600/30 hover:bg-red-600/30 disabled:opacity-50 transition-colors text-xs"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m3 0V5a2 2 0 012-2h0a2 2 0 012 2v2"
                              />
                            </svg>

                            {actionLoading === "delete-thread"
                              ? "Apagando..."
                              : "Apagar"}
                          </button>
                        </>
                      )}

                      {thread.is_closed && (
                        <button
                          onClick={handleReopenThread}
                          disabled={actionLoading === "reopen"}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-50 transition-colors text-xs"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          {actionLoading === "reopen"
                            ? "Reabrindo..."
                            : "Reabrir"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editingThread ? (
                  <div className="space-y-4 mb-4">
                    <input
                      value={editThreadTitle}
                      onChange={(e) => setEditThreadTitle(e.target.value)}
                      className="w-full bg-[#020617] border border-[#4A5260] rounded-lg px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
                      placeholder="Título da dúvida"
                    />

                    <div className="rounded-lg overflow-hidden border border-[#4A5260]">
                      <MarkdownEditor
                        initialContent={editThreadBody}
                        onChange={(content) => setEditThreadBody(content)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEditThread}
                        className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 transition-colors text-sm"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={handleUpdateThread}
                        disabled={
                          actionLoading === "edit-thread" ||
                          !editThreadTitle.trim() ||
                          !editThreadBody.trim()
                        }
                        className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 transition-colors text-sm"
                      >
                        {actionLoading === "edit-thread"
                          ? "Salvando..."
                          : "Salvar edição"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Título da dúvida */}
                    <h2 className="text-2xl font-bold text-white mb-4">
                      {thread.title}
                    </h2>

                    {/* Conteúdo Markdown */}
                    <div className="bg-[#1B1F27] rounded-lg p-4 border border-[#2F3541] mb-4">
                      {processingContent ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                          <span className="text-sm text-gray-400">
                            Processando...
                          </span>
                        </div>
                      ) : (
                        <div className="markdown-body wmde-markdown wmde-markdown-color">
                          <div
                            dangerouslySetInnerHTML={{ __html: threadHtml }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Status */}
                <div className="flex gap-2 mt-4">
                  {thread.is_closed && (
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs border border-green-500/30">
                      Resolvida
                    </span>
                  )}
                  {thread.best_reply_id && (
                    <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30">
                      Melhor resposta selecionada
                    </span>
                  )}
                  {thread.linkable_type && (
                    <span className="bg-[#1B1F27] px-3 py-1 rounded-lg border border-[#2F3541] text-xs">
                      {thread.linkable_type === "App\\Models\\CourseContent"
                        ? "Aula"
                        : "Questão"}{" "}
                      #{thread.linkable_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Aula Relacionada (se existir) - Bloco separado */}
          {linkable &&
            thread.linkable_type === "App\\Models\\CourseContent" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border border-[#2F3541] rounded-xl p-6 bg-[#0F172A]"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-[#0E00D0] rounded-full"></div>
                  <h3 className="text-lg font-bold text-white">
                    Aula Relacionada
                  </h3>
                </div>

                {/* Título da aula acima do vídeo */}
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-white mb-2">
                    {linkable.title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatDuration(linkable.duration_in_seconds)}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{linkable.content_type}</span>
                  </div>
                </div>

                {/* Player de Vídeo */}
                <div className="relative pt-[56.25%] overflow-hidden bg-black rounded-lg border border-[#2F3541] mb-4">
                  <iframe
                    src={linkable.content_url}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={`Vídeo: ${linkable.title}`}
                  />
                </div>

                <div className="text-gray-300 text-sm leading-relaxed">
                  <p>
                    Esta dúvida está relacionada a esta aula. Assista ao vídeo
                    para entender melhor o contexto.
                  </p>
                </div>
              </motion.div>
            )}

          {/* Respostas */}
          <div className="space-y-6">
            <div className="border-b border-[#2F3541] pb-4">
              <h3 className="text-lg font-bold text-white">
                Respostas
                <span className="ml-2 px-2.5 py-0.5 bg-[#1B1F27] text-sm font-medium rounded-full border border-[#2F3541]">
                  {thread.replies?.length || 0}
                </span>
              </h3>
            </div>

            <AnimatePresence>
              {thread.replies && thread.replies.length > 0 ? (
                thread.replies.map((reply: ForumReply, index: number) => {
                  const isReplyAuthor =
                    session?.user?.id === reply.author.id.toString();

                  return (
                    <motion.div
                      key={reply.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`border rounded-xl p-6 ${
                        reply.id === thread.best_reply_id
                          ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-transparent relative overflow-hidden"
                          : "border-[#2F3541] bg-[#0F172A]"
                      }`}
                    >
                      {reply.id === thread.best_reply_id && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                            MELHOR RESPOSTA
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                              reply.id === thread.best_reply_id
                                ? "border-yellow-500 bg-yellow-500/20"
                                : "border-[#2F3541] bg-[#1B1F27]"
                            }`}
                          >
                            {reply.author.avatar ? (
                              <img
                                src={reply.author.avatar}
                                alt={reply.author.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <span
                                className={`text-base font-bold ${
                                  reply.id === thread.best_reply_id
                                    ? "text-yellow-300"
                                    : "text-gray-300"
                                }`}
                              >
                                {reply.author.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <h4 className="font-bold text-white">
                              {reply.author.name}
                            </h4>

                            <span className="text-sm text-gray-400">
                              {new Date(reply.created_at).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>

                            <div className="ml-auto flex items-center gap-2">
                              {isReplyAuthor && editingReplyId !== reply.id && (
                                <button
                                  onClick={() => startEditReply(reply)}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-xs"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                                    />
                                  </svg>
                                  Editar
                                </button>
                              )}

                              {isReplyAuthor && (
                                <button
                                  onClick={() => openDeleteReplyModal(reply.id)}
                                  disabled={
                                    actionLoading === `delete-reply-${reply.id}`
                                  }
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-600/30 hover:bg-red-600/30 disabled:opacity-50 transition-colors text-xs"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m3 0V5a2 2 0 012-2h0a2 2 0 012 2v2"
                                    />
                                  </svg>

                                  {actionLoading === `delete-reply-${reply.id}`
                                    ? "Apagando..."
                                    : "Apagar"}
                                </button>
                              )}

                              {isAuthor &&
                                !thread.is_closed &&
                                reply.id !== thread.best_reply_id && (
                                  <button
                                    onClick={() =>
                                      handleMarkBestReply(reply.id)
                                    }
                                    disabled={
                                      actionLoading === `mark-${reply.id}`
                                    }
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 transition-colors text-xs"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    {actionLoading === `mark-${reply.id}`
                                      ? "Marcando..."
                                      : "Melhor resposta"}
                                  </button>
                                )}
                            </div>
                          </div>

                          <div className="bg-[#1B1F27] rounded-lg p-4 border border-[#2F3541]">
                            {editingReplyId === reply.id ? (
                              <div className="space-y-4">
                                <div className="rounded-lg overflow-hidden border border-[#4A5260]">
                                  <MarkdownEditor
                                    initialContent={editReplyBody}
                                    onChange={(content) =>
                                      setEditReplyBody(content)
                                    }
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={cancelEditReply}
                                    className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 transition-colors text-sm"
                                  >
                                    Cancelar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateReply(reply.id)}
                                    disabled={
                                      actionLoading ===
                                        `edit-reply-${reply.id}` ||
                                      !editReplyBody.trim()
                                    }
                                    className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 transition-colors text-sm"
                                  >
                                    {actionLoading === `edit-reply-${reply.id}`
                                      ? "Salvando..."
                                      : "Salvar edição"}
                                  </button>
                                </div>
                              </div>
                            ) : processingContent ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                                <span className="text-sm text-gray-400">
                                  Processando...
                                </span>
                              </div>
                            ) : repliesHtml[reply.id] ? (
                              <div
                                className="markdown-body wmde-markdown wmde-markdown-color text-sm"
                                dangerouslySetInnerHTML={{
                                  __html: repliesHtml[reply.id],
                                }}
                              />
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{ __html: reply.body }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-400 border border-[#2F3541] rounded-xl bg-[#0F172A]">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h4 className="text-lg font-semibold mb-2">
                    Nenhuma resposta ainda
                  </h4>
                  <p>Seja o primeiro a responder esta dúvida!</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Formulário de Resposta */}
          {!thread.is_closed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="border border-[#2F3541] rounded-xl p-6 bg-[#0F172A]"
            >
              <h3 className="text-lg font-bold text-white mb-6">
                Sua Resposta
              </h3>

              <form onSubmit={handlePostReply} className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-[#4A5260]">
                  <MarkdownEditor
                    initialContent={replyBody}
                    onChange={(content) => setReplyBody(content)}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={posting || !replyBody.trim()}
                    className="px-6 py-3 rounded-lg bg-[#0E00D0] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
                  >
                    {posting ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Publicando...
                      </span>
                    ) : (
                      "Publicar Resposta"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {thread.is_closed && !thread.replies?.length && (
            <div className="text-center py-12 border border-[#2F3541] rounded-xl bg-gradient-to-br from-green-500/5 to-transparent">
              <svg
                className="w-20 h-20 mx-auto mb-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-2xl font-bold text-green-400 mb-3">
                Dúvida Resolvida!
              </h3>
              <p className="text-gray-300 max-w-md mx-auto">
                Esta discussão foi marcada como resolvida pelo autor.
                {thread.best_reply_id &&
                  " Uma resposta foi selecionada como a melhor solução."}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {deleteModal.open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={actionLoading ? undefined : closeDeleteModal}
          />

          <div className="relative z-[9999] w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0F172A] shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
                  <svg
                    className="h-6 w-6 text-red-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    {deleteModal.type === "thread"
                      ? "Apagar dúvida?"
                      : "Apagar resposta?"}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    {deleteModal.type === "thread"
                      ? "Esta dúvida será removida do fórum. As respostas vinculadas a ela também deixarão de aparecer."
                      : "Esta resposta será removida da discussão. Caso ela seja a melhor resposta, a dúvida poderá voltar ao estado aberto."}
                  </p>

                  <p className="mt-3 text-xs text-red-300/90">
                    Esta ação não deve ser executada sem plena certeza.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#2F3541] bg-[#020617]/60 px-6 py-4">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={!!actionLoading}
                className="rounded-lg border border-[#4A5260] bg-[#1B1F27] px-4 py-2 text-sm text-gray-300 hover:bg-[#252B36] disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={
                  actionLoading === "delete-thread" ||
                  actionLoading === `delete-reply-${deleteModal.replyId}`
                }
                className="rounded-lg border border-red-500/40 bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "delete-thread" ||
                actionLoading === `delete-reply-${deleteModal.replyId}`
                  ? "Apagando..."
                  : deleteModal.type === "thread"
                    ? "Apagar dúvida"
                    : "Apagar resposta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {zoomedImageUrl && (
        <ImageLightbox
          imageUrl={zoomedImageUrl}
          onClose={() => setZoomedImageUrl(null)}
        />
      )}
    </div>
  );
};

export default ThreadDetail;

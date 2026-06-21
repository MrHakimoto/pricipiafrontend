// components/modules/DuvidaCard.tsx
"use client";

import MarkdownEditor from "@/components/editor/MarkDownEditor";
import { ModalDuvidaContent } from "@/components/modules/ModalDuvidaContent";
import {
  createForumThread,
  getForumThreads,
  type CreateThreadData,
  type ForumThread,
} from "@/lib/forum/forum";
import { toggleLike } from "@/lib/course/like";
import { processMarkdownPreview } from "@/utils/markdownProcessorPreview";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  ThumbsUp,
  UserCircle2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DuvidaQuestaoProps {
  courseContentId?: number;
  enunciado?: string;
  onDuvidaChange?: (duvida: string) => void;
}

type LikeableForumThread = ForumThread & {
  likes_count?: number;
  liked_by_me?: boolean;
  replies_count?: number;
  author?: {
    id?: number;
    name?: string;
    avatar?: string | null;
  };
};

function ForumThreadLikeButton({
  token,
  threadId,
  initialLiked = false,
  initialCount = 0,
  onSynced,
}: {
  token?: string;
  threadId: number;
  initialLiked?: boolean;
  initialCount?: number;
  onSynced?: (payload: { liked: boolean; likes_count: number }) => void;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const disabled = !token || loading || !threadId;

  useEffect(() => {
    setLiked(initialLiked);
    setLikesCount(initialCount);
  }, [initialLiked, initialCount, threadId]);

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
        entity_type: "duvida",
        entity_id: threadId,
      });

      setLiked(response.liked);
      setLikesCount(response.likes_count);
      onSynced?.({
        liked: response.liked,
        likes_count: response.likes_count,
      });
    } catch (error) {
      console.error("Erro ao curtir dúvida:", error);

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
      title={liked ? "Remover curtida" : "Curtir dúvida"}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      className={`
        relative inline-flex min-h-9 items-center justify-center gap-1.5 overflow-hidden
        rounded-xl border px-2.5 py-1.5 text-xs font-bold transition
        disabled:cursor-not-allowed disabled:opacity-50
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

      <span className="relative z-10 hidden min-[390px]:inline">
        {liked ? "Curtido" : "Curtir"}
      </span>

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

export const DuvidaCard: React.FC<DuvidaQuestaoProps> = ({
  courseContentId,
  enunciado = "Este é o conteúdo da aula...",
  onDuvidaChange,
}) => {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [threadsRelacionadas, setThreadsRelacionadas] = useState<
    LikeableForumThread[]
  >([]);
  const [carregandoThreads, setCarregandoThreads] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [threadSelecionada, setThreadSelecionada] = useState("");
  const [threadsPreview, setThreadsPreview] = useState<Record<number, string>>(
    {},
  );
  const [processandoPreview, setProcessandoPreview] = useState(false);

  const { data: session } = useSession();

  const token = session?.laravelToken;
  const user = session?.user;

  useEffect(() => {
    if (courseContentId && token) {
      carregarThreadsRelacionadas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseContentId, token]);

  async function processarPreviewThreads(threads: LikeableForumThread[]) {
    setProcessandoPreview(true);

    try {
      const mapa: Record<number, string> = {};

      for (const thread of threads) {
        mapa[thread.id] = await processMarkdownPreview(thread.body);
      }

      setThreadsPreview(mapa);
    } catch (err) {
      console.error("Erro ao gerar preview das threads:", err);
    } finally {
      setProcessandoPreview(false);
    }
  }

  async function carregarThreadsRelacionadas() {
    if (!token || !courseContentId) return;

    setCarregandoThreads(true);

    try {
      const response = await getForumThreads(token, 1);

      const threadsDaAula = response.data.filter(
        (thread: LikeableForumThread) =>
          thread.linkable_type === "App\\Models\\CourseContent" &&
          Number(thread.linkable_id) === Number(courseContentId),
      );

      setThreadsRelacionadas(threadsDaAula);
      await processarPreviewThreads(threadsDaAula);
    } catch (error) {
      console.error("Erro ao carregar threads relacionadas:", error);
    } finally {
      setCarregandoThreads(false);
    }
  }

  function handleMensagemChange(novaMensagem: string) {
    setMensagem(novaMensagem);

    if (onDuvidaChange) {
      onDuvidaChange(novaMensagem);
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

      if (onDuvidaChange) {
        onDuvidaChange("");
      }

      await carregarThreadsRelacionadas();

      setThreadSelecionada(String(novaThread.id));
      setModalAberto(true);
    } catch (error) {
      console.error("Erro ao enviar dúvida:", error);
      alert("Erro ao enviar dúvida. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function handleAbrirDiscussao(threadId: string) {
    setThreadSelecionada(threadId);
    setModalAberto(true);
  }

  function handleNovaDuvida() {
    setThreadSelecionada("");
    setModalAberto(true);
  }

  function handleLikeSynced(
    threadId: number,
    payload: { liked: boolean; likes_count: number },
  ) {
    setThreadsRelacionadas((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              liked_by_me: payload.liked,
              likes_count: payload.likes_count,
            }
          : thread,
      ),
    );
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

  function contarRespostas(thread: LikeableForumThread) {
    return thread.replies_count || thread.replies?.length || 0;
  }

  function cleanText(value: string) {
    return value.replace(/<[^>]*>/g, "").trim();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="my-4 flex w-full justify-center sm:my-6"
      >
        <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220] shadow-2xl">
          <div className="border-b border-white/10 bg-white/[0.03] px-3 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300 sm:h-11 sm:w-11">
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white sm:text-lg">
                  Tire sua Dúvida
                </h3>

                <p className="mt-0.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  Envie uma pergunta ou acompanhe dúvidas já abertas nesta aula.
                </p>
              </div>

              {threadsRelacionadas.length > 0 && (
                <button
                  type="button"
                  onClick={handleNovaDuvida}
                  className="
                    hidden shrink-0 items-center gap-2 rounded-xl border border-blue-500/30
                    bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-200
                    transition hover:bg-blue-500/20 sm:inline-flex
                  "
                >
                  <Plus className="h-4 w-4" />
                  Nova
                </button>
              )}
            </div>
          </div>

          <div className="space-y-5 p-3 sm:p-5">
            <div className="rounded-2xl border border-white/10 bg-[#050B1A]/60 p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-white">
                  Aula #{courseContentId}
                </h4>

                {threadsRelacionadas.length > 0 && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                    {threadsRelacionadas.length} dúvida
                    {threadsRelacionadas.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <p className="line-clamp-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
                {cleanText(enunciado).substring(0, 220)}
                {cleanText(enunciado).length > 220 ? "..." : ""}
              </p>
            </div>

            {carregandoThreads && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-5 text-sm text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                Carregando dúvidas...
              </div>
            )}

            {!carregandoThreads && threadsRelacionadas.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                      <MessageSquare className="h-4 w-4 text-blue-300" />
                      Dúvidas relacionadas
                    </h4>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Veja discussões já abertas sobre esta aula.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleNovaDuvida}
                    className="
                      inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5
                      rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5
                      text-xs font-bold text-blue-200 transition hover:bg-blue-500/20
                      sm:hidden
                    "
                  >
                    <Plus className="h-4 w-4" />
                    Nova
                  </button>
                </div>

                <div className="space-y-3">
                  {threadsRelacionadas.map((thread, index) => {
                    const repliesCount = contarRespostas(thread);
                    const preview =
                      threadsPreview[thread.id] ||
                      (processandoPreview ? "Gerando preview..." : "");

                    return (
                      <motion.article
                        key={thread.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.22,
                          delay: Math.min(index * 0.04, 0.18),
                        }}
                        onClick={() => handleAbrirDiscussao(String(thread.id))}
                        className="
                          group cursor-pointer rounded-2xl border border-white/10
                          bg-[#0F172A] p-3 transition hover:border-blue-500/40
                          hover:bg-white/[0.04] sm:p-4
                        "
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
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

                                {thread.is_closed && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-bold text-green-300">
                                    <CheckCircle2 className="h-3 w-3" />
                                    respondida
                                  </span>
                                )}
                              </div>

                              <h5 className="line-clamp-2 text-sm font-bold leading-snug text-white transition group-hover:text-blue-200 sm:text-base">
                                {thread.title}
                              </h5>
                            </div>

                            <ForumThreadLikeButton
                              token={token}
                              threadId={thread.id}
                              initialLiked={Boolean(thread.liked_by_me)}
                              initialCount={thread.likes_count ?? 0}
                              onSynced={(payload) =>
                                handleLikeSynced(thread.id, payload)
                              }
                            />
                          </div>

                          {preview && (
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                              <p className="line-clamp-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
                                {preview}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5">
                                {thread.author?.avatar ? (
                                  <img
                                    src={thread.author.avatar}
                                    alt={thread.author.name || "Autor"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserCircle2 className="h-4 w-4 text-slate-500" />
                                )}
                              </div>

                              <span className="truncate">
                                {thread.author?.name || "Usuário"}
                              </span>

                              <span className="shrink-0 text-slate-600">•</span>

                              <span className="shrink-0">
                                {formatarData(thread.created_at)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                              <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {repliesCount}
                                <span className="hidden min-[390px]:inline">
                                  resposta{repliesCount !== 1 ? "s" : ""}
                                </span>
                              </span>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleAbrirDiscussao(String(thread.id));
                                }}
                                className="
                                  inline-flex min-h-9 items-center justify-center gap-1.5
                                  rounded-xl border border-white/10 bg-white/5 px-3
                                  text-xs font-bold text-slate-200 transition
                                  hover:bg-white/10 hover:text-white
                                "
                              >
                                <Eye className="h-4 w-4" />
                                Abrir
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            )}

            {!carregandoThreads && threadsRelacionadas.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0F172A] p-6 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-500" />

                <p className="mt-3 text-sm font-bold text-slate-300">
                  Nenhuma dúvida sobre esta aula ainda.
                </p>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Seja o primeiro a perguntar ou envie uma dúvida logo abaixo.
                </p>

                <button
                  type="button"
                  onClick={handleNovaDuvida}
                  className="
                    mx-auto mt-4 inline-flex min-h-10 items-center justify-center gap-2
                    rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white
                    transition hover:bg-blue-700 active:scale-95
                  "
                >
                  <MessageCircle className="h-4 w-4" />
                  Perguntar no modal
                </button>
              </div>
            )}

            <section className="rounded-2xl border border-white/10 bg-[#0F172A] p-3 sm:p-5">
              <div className="mb-3">
                <label className="block text-sm font-bold text-white">
                  Sua dúvida *
                </label>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Escreva com detalhes o ponto que você não entendeu. Você pode
                  usar Markdown, fórmulas e imagens.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050B1A]">
                <MarkdownEditor
                  initialContent={mensagem}
                  onChange={handleMensagemChange}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-yellow-700/50 bg-yellow-900/20 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-yellow-300">
                  <span>💡</span>
                  Dicas para uma boa pergunta
                </div>

                <ul className="space-y-1 text-xs leading-relaxed text-yellow-100/90">
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
                  transition hover:bg-green-700 disabled:cursor-not-allowed
                  disabled:bg-gray-600 disabled:opacity-70 active:scale-[0.99]
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

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center text-xs leading-relaxed text-slate-400">
                <p>⌛ Resposta em até 24 horas</p>
                <p>Resposta por especialistas da matéria</p>
              </div>
            </section>
          </div>
        </div>
      </motion.div>

      <ModalDuvidaContent
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        courseContentId={courseContentId}
        threadId={threadSelecionada}
        modo={threadSelecionada ? "discussao" : "nova"}
        enunciado={enunciado}
      />
    </>
  );
};
// components/questions/feedback/duvida.tsx
"use client";

import MarkdownEditor from "@/components/editor/MarkDownEditor";
import { ModalDuvida } from "@/components/questions/feedback/modalDuvida";
import { AnimatedRoleName } from "@/components/user/AnimatedRoleName";
import {
  createForumThread,
  getForumThreads,
  type CreateThreadData,
  type ForumThread,
} from "@/lib/forum/forum";
import { processMarkdown } from "@/utils/markdownProcessor";
import { motion } from "framer-motion";
import {
  Eye,
  Loader2,
  MessageCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getLevelTitle } from "@/lib/gamification/levels";

interface DuvidaQuestaoProps {
  questaoId?: number;
  enunciado?: string;
  onDuvidaChange?: (duvida: string) => void;
}

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

function ProcessedEnunciadoPreview({ enunciado }: { enunciado: string }) {
  const [processedEnunciado, setProcessedEnunciado] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const html = await processMarkdown(enunciado ?? "");

        if (!cancelled) {
          setProcessedEnunciado(html);
        }
      } catch (error) {
        console.error("Erro ao processar enunciado:", error);

        if (!cancelled) {
          setProcessedEnunciado(enunciado ?? "");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [enunciado]);

  return (
    <div
      className={[
        "markdown-body wmde-markdown wmde-markdown-color line-clamp-3 break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300",
        "[&_p]:my-0 [&_img]:my-2 [&_img]:max-h-56 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:object-contain",
      ].join(" ")}
      style={
        {
          "--color-canvas-default": "transparent",
          "--color-fg-default": "currentColor",
        } as CSSProperties
      }
      dangerouslySetInnerHTML={{ __html: processedEnunciado }}
    />
  );
}

export const DuvidaQuestao: React.FC<DuvidaQuestaoProps> = ({
  questaoId,
  enunciado = "Este é o enunciado da questão...",
  onDuvidaChange,
}) => {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [threadsRelacionadas, setThreadsRelacionadas] = useState<
    ForumThread[]
  >([]);
  const [carregandoThreads, setCarregandoThreads] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [threadSelecionada, setThreadSelecionada] = useState("");

  const { data: session } = useSession();

  const sessionAny = session as any;
  const token = sessionAny?.laravelToken;
  const user = sessionAny?.user;

  useEffect(() => {
    if (questaoId && token) {
      carregarThreadsRelacionadas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questaoId, token]);

  const carregarThreadsRelacionadas = async () => {
    if (!token || !questaoId) return;

    setCarregandoThreads(true);

    try {
      const response = await getForumThreads(token, 1);

      const threadsDaQuestao = response.data.filter(
        (thread) =>
          thread.linkable_type === "App\\Models\\Questao" &&
          Number(thread.linkable_id) === Number(questaoId),
      );

      setThreadsRelacionadas(threadsDaQuestao);
    } catch (error) {
      console.error("Erro ao carregar threads relacionadas:", error);
    } finally {
      setCarregandoThreads(false);
    }
  };

  const handleMensagemChange = (novaMensagem: string) => {
    setMensagem(novaMensagem);

    if (onDuvidaChange) {
      onDuvidaChange(novaMensagem);
    }
  };

  const handleEnviarDuvida = async () => {
    if (!mensagem.trim() || !token || !questaoId || !user) {
      alert("Preencha sua dúvida antes de enviar.");
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
  };

  const handleAbrirDiscussao = (threadId: string) => {
    setThreadSelecionada(threadId);
    setModalAberto(true);
  };

  const handleNovaDuvida = () => {
    setThreadSelecionada("");
    setModalAberto(true);
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const contarRespostas = (thread: ForumThread) => {
    return thread.replies_count || thread.replies?.length || 0;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="my-6 flex justify-center"
      >
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#0e1525]">
          <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <MessageCircle className="text-blue-500" size={24} />

            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-950 dark:text-white">
                Tire sua Dúvida
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nossa equipe de especialistas vai te ajudar
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#131b2d]">
              <h4 className="mb-2 font-medium text-gray-950 dark:text-white">
                Questão #{questaoId}
              </h4>

              <ProcessedEnunciadoPreview enunciado={enunciado} />
            </div>

            {threadsRelacionadas.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-medium text-gray-950 dark:text-white">
                    <MessageSquare size={18} />
                    Dúvidas Relacionadas ({threadsRelacionadas.length})
                  </h4>

                  <button
                    type="button"
                    onClick={handleNovaDuvida}
                    className="flex items-center gap-1 text-sm text-blue-700 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <MessageCircle size={14} />
                    Nova Dúvida
                  </button>
                </div>

                <div className="space-y-3">
                  {threadsRelacionadas.map((thread) => {
                    const author = (thread as any).author;

                    return (
                      <div
                        key={thread.id}
                        className="group cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:border-blue-500/50 dark:border-gray-700 dark:bg-[#131b2d]"
                        onClick={() => handleAbrirDiscussao(String(thread.id))}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h5 className="text-sm font-medium text-gray-950 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                            {thread.title}
                          </h5>

                          <div className="flex gap-2">
                            <span
                              className={`rounded px-2 py-1 text-xs ${
                                thread.is_closed
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                              }`}
                            >
                              {thread.is_closed ? "Resolvido" : "Aberto"}
                            </span>
                          </div>
                        </div>

                        <p className="mb-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                          {thread.body}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <span>Por:</span>

                              <AnimatedRoleName
                                name={author?.name ?? "Usuário"}
                                roles={getAuthorRoles(author)}
                                role={getAuthorPrimaryRole(author)}
                                level={getAuthorLevel(author)}
                                levelTitle={getAuthorLevelTitle(author)}
                                nameClassName="text-xs"
                              />
                            </span>

                            <span>•</span>

                            <span>{formatarData(thread.created_at)}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 dark:text-gray-500">
                              {contarRespostas(thread)} resposta
                              {contarRespostas(thread) !== 1 ? "s" : ""}
                            </span>

                            <Eye
                              size={14}
                              className="text-gray-500 dark:text-gray-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {carregandoThreads && (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-blue-500" size={20} />
              </div>
            )}

            {threadsRelacionadas.length === 0 && !carregandoThreads && (
              <div className="mb-6 py-4 text-center">
                <MessageSquare
                  className="mx-auto mb-2 text-gray-500 dark:text-gray-500"
                  size={32}
                />

                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Nenhuma dúvida sobre esta questão ainda.
                </p>

                <button
                  type="button"
                  onClick={handleNovaDuvida}
                  className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                >
                  <MessageCircle size={16} />
                  Ser o primeiro a perguntar
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-950 dark:text-white">
                  Sua Dúvida *
                </label>

                <MarkdownEditor
                  initialContent={mensagem}
                  onChange={handleMensagemChange}
                />
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
                onClick={handleEnviarDuvida}
                disabled={!mensagem.trim() || enviando}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
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

            <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>⌛ Resposta em até 24 horas</p>
              <p>Resposta por especialistas da matéria</p>
            </div>
          </div>
        </div>
      </motion.div>

      <ModalDuvida
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        questaoId={questaoId}
        threadId={threadSelecionada}
        modo={threadSelecionada ? "discussao" : "nova"}
        enunciado={enunciado}
      />
    </>
  );
};
// components/modules/ModalDuvidaContent.tsx
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
  createForumThread
} from "@/lib/forum/forum";
import { X, MessageCircle, Send, Loader2, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { processMarkdown } from "@/utils/markdownProcessor";

// Definindo a interface do MarkdownEditor
interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

// Importação dinâmica com tipo
const MarkdownEditor = dynamic<MarkdownEditorProps>(
  () => import("@/components/editor/MarkDownEditor").then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-[#0F172A] rounded-md border border-[#2F3541] animate-pulse flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={24} />
      </div>
    )
  }
);

interface ModalDuvidaProps {
  isOpen: boolean;
  onClose: () => void;
  courseContentId?: number;
  enunciado?: string;
  threadId?: string;
  modo?: "nova" | "discussao";
}

export const ModalDuvidaContent: React.FC<ModalDuvidaProps> = ({
  isOpen,
  onClose,
  courseContentId,
  enunciado = "Este é o conteúdo da aula...",
  threadId,
  modo = "nova"
}) => {
  const { data: session, status } = useSession();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [processingContent, setProcessingContent] = useState(false);
  const [threadHtml, setThreadHtml] = useState<string>('');
  const [repliesHtml, setRepliesHtml] = useState<Record<number, string>>({});
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  
  const token = session?.laravelToken;
  const user = session?.user;

  // Efeito para carregar a thread quando abrir modal em modo discussão
  useEffect(() => {
    if (isOpen) {
      if (modo === "discussao" && threadId && token) {
        carregarThread();
      } else {
        setLoading(false);
      }
    }
  }, [isOpen, threadId, modo, token]);

  // Efeito para processar markdown quando thread mudar
  useEffect(() => {
    if (thread) {
      processThreadContent();
    }
  }, [thread]);

  // Efeito para lidar com clique em imagens
  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.tagName === 'IMG') {
        const src = target.getAttribute('src');
        if (src) {
          setZoomedImageUrl(src);
        }
      }
    };

    if (isOpen && (threadHtml || Object.keys(repliesHtml).length > 0)) {
      document.addEventListener('click', handleImageClick);
    }

    return () => {
      document.removeEventListener('click', handleImageClick);
    };
  }, [isOpen, threadHtml, repliesHtml]);

  const carregarThread = async () => {
    if (!token || !threadId) return;
    
    setLoading(true);
    try {
      const data = await getForumThreadDetails(token, threadId);
      setThread(data);
    } catch (error) {
      console.error('Erro ao carregar thread:', error);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Erro ao processar conteúdo Markdown:', error);
    } finally {
      setProcessingContent(false);
    }
  };

  const handleEnviarDuvida = async () => {
    if (!mensagem.trim() || !token || !courseContentId || !user) {
      alert("Preencha sua dúvida antes de enviar.");
      return;
    }

    setEnviando(true);
    try {
      const threadData: CreateThreadData = {
        title: `Dúvida na Aula #${courseContentId}`,
        body: mensagem,
        linkable_type: 'CourseContent',
        linkable_id: courseContentId
      };

      const novaThread = await createForumThread(token, threadData);
      
      console.log("Dúvida enviada com sucesso!", { courseContentId, mensagem });
      setMensagem("");
      setEditorKey(prev => prev + 1);
      
      // Mudar para modo de discussão com a nova thread
      setThread(novaThread);
      modo = "discussao";
      
      alert("Dúvida enviada com sucesso! Nossa equipe responderá em breve.");
    } catch (error) {
      console.error("Erro ao enviar dúvida:", error);
      alert("Erro ao enviar dúvida. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim() || !token || !thread) return;

    setEnviando(true);
    try {
      await postForumReply(token, thread.id, mensagem);
      setMensagem('');
      setEditorKey(prev => prev + 1);
      await carregarThread();
    } catch (error) {
      console.error('Erro ao postar resposta:', error);
    } finally {
      setEnviando(false);
    }
  };

  const handleMarkBestReply = async (replyId: number) => {
    if (!token || !thread) return;
    
    setActionLoading(`mark-${replyId}`);
    try {
      await markBestReply(token, thread.id, replyId);
      await carregarThread();
    } catch (error) {
      console.error('Erro ao marcar melhor resposta:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenThread = async () => {
    if (!token || !thread) return;
    
    setActionLoading('reopen');
    try {
      await reopenThread(token, thread.id);
      await carregarThread();
    } catch (error) {
      console.error('Erro ao reabrir thread:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const isAuthor = user?.id === thread?.author.id.toString();

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setThread(null);
      setMensagem("");
      setLoading(true);
      setEditorKey(0);
      setThreadHtml('');
      setRepliesHtml({});
      setProcessingContent(false);
      setZoomedImageUrl(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#00091A] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#1B1F27]">
              <div className="flex items-center gap-3">
                <MessageCircle className="text-blue-500" size={24} />
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {modo === "nova" ? "Tire sua Dúvida" : "Discussão da Dúvida"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {modo === "nova" 
                      ? "Nossa equipe de especialistas vai te ajudar" 
                      : `Aula #${courseContentId}`
                    }
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : modo === "nova" || !thread ? (
                // Modo Nova Dúvida
                <div className="p-6">
                  {/* Preview da Aula */}
                  <div className="bg-[#131b2d] rounded-lg p-4 mb-6 border border-gray-700">
                    <h4 className="text-white font-medium mb-2">Aula #{courseContentId}</h4>
                    <p className="text-gray-300 text-sm line-clamp-3">
                      {enunciado.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>
                  </div>

                  {/* Formulário de Dúvida */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Sua Dúvida *
                      </label>
                      <div className="min-h-[192px]">
                        <MarkdownEditor
                          key={`nova-duvida-${editorKey}`}
                          initialContent={mensagem}
                          onChange={(content: string) => setMensagem(content)}
                        />
                      </div>
                    </div>

                    {/* Dicas */}
                    <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-700">
                      <div className="flex items-center gap-2 text-yellow-300 text-sm font-medium mb-1">
                        <span>💡</span>
                        Dicas para uma boa pergunta:
                      </div>
                      <ul className="text-yellow-200 text-xs space-y-1">
                        <li>• Seja específico sobre o que não entendeu</li>
                        <li>• Mencione o minuto da aula onde tem dúvida</li>
                        <li>• Compartilhe seu raciocínio atual</li>
                      </ul>
                    </div>

                    {/* Botão Enviar */}
                    <button
                      onClick={handleEnviarDuvida}
                      disabled={!mensagem.trim() || enviando}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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

                  {/* Informações Adicionais */}
                  <div className="mt-6 text-center text-gray-400 text-xs">
                    <p>⌛ Resposta em até 24 horas</p>
                    <p>Resposta por especialistas da matéria</p>
                  </div>
                </div>
              ) : (
                // Modo Discussão (Thread Existente)
                <div className="p-6 space-y-6">
                  {/* Tópico Principal */}
                  <div className="border border-[#2F3541] rounded-xl p-6 bg-[#0F172A]">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-[#1B1F27] rounded-full flex items-center justify-center border border-[#2F3541]">
                          {thread.author.avatar ? (
                            <img
                              src={thread.author.avatar}
                              alt={thread.author.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-gray-300">
                              {thread.author.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h2 className="text-xl font-bold text-white">{thread.title}</h2>
                          
                          <div className="flex gap-2">
                            {thread.is_closed && (
                              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
                                Resolvida
                              </span>
                            )}
                            {thread.best_reply_id && (
                              <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm border border-yellow-500/30">
                                Melhor resposta selecionada
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Conteúdo processado da thread */}
                        <div className="text-gray-300 leading-relaxed">
                          {processingContent ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                              <span>Processando conteúdo...</span>
                            </div>
                          ) : (
                            <div className="markdown-body wmde-markdown wmde-markdown-color">
                              <div dangerouslySetInnerHTML={{ __html: threadHtml }} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                          <span>Por {thread.author.name}</span>
                          <span>•</span>
                          <span>{formatarData(thread.created_at)}</span>
                          
                          {thread.linkable_type && (
                            <>
                              <span>•</span>
                              <span className="bg-[#1B1F27] px-3 py-1 rounded-lg border border-[#2F3541]">
                                Aula #{thread.linkable_id}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações do Autor */}
                    {isAuthor && thread.is_closed && (
                      <div className="flex justify-end pt-4 border-t border-[#2F3541]">
                        <button
                          onClick={handleReopenThread}
                          disabled={actionLoading === 'reopen'}
                          className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-50 transition-colors text-sm"
                        >
                          {actionLoading === 'reopen' ? 'Reabrindo...' : 'Reabrir Discussão'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Respostas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-[#2F3541] pb-3">
                      Respostas ({thread.replies?.length || 0})
                    </h3>

                    <AnimatePresence>
                      {thread.replies?.map((reply: ForumReply, index: number) => (
                        <motion.div
                          key={reply.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className={`border rounded-xl p-6 ${
                            reply.id === thread.best_reply_id
                              ? 'border-yellow-500/50 bg-yellow-500/5'
                              : 'border-[#2F3541] bg-[#0F172A]'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                                reply.id === thread.best_reply_id
                                  ? 'border-yellow-500 bg-yellow-500/20'
                                  : 'border-[#2F3541] bg-[#1B1F27]'
                              }`}>
                                {reply.author.avatar ? (
                                  <img
                                    src={reply.author.avatar}
                                    alt={reply.author.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <span className={`text-sm font-semibold ${
                                    reply.id === thread.best_reply_id ? 'text-yellow-300' : 'text-gray-300'
                                  }`}>
                                    {reply.author.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <h4 className="font-semibold text-white">{reply.author.name}</h4>
                                
                                {reply.id === thread.best_reply_id && (
                                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30 flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    Melhor Resposta
                                  </span>
                                )}
                                
                                <span className="text-sm text-gray-400">
                                  {formatarData(reply.created_at)}
                                </span>
                              </div>
                              
                              {/* Conteúdo processado da resposta */}
                              <div className="text-gray-300 leading-relaxed">
                                {processingContent ? (
                                  <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                                    <span className="text-sm text-gray-400">Processando...</span>
                                  </div>
                                ) : repliesHtml[reply.id] ? (
                                  <div className="markdown-body wmde-markdown wmde-markdown-color">
                                    <div dangerouslySetInnerHTML={{ __html: repliesHtml[reply.id] }} />
                                  </div>
                                ) : (
                                  <div dangerouslySetInnerHTML={{ __html: reply.body }} />
                                )}
                              </div>
                              
                              {/* Botão Marcar como Melhor Resposta */}
                              {isAuthor && !thread.is_closed && reply.id !== thread.best_reply_id && (
                                <div className="flex justify-end mt-4">
                                  <button
                                    onClick={() => handleMarkBestReply(reply.id)}
                                    disabled={actionLoading === `mark-${reply.id}`}
                                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 transition-colors text-sm"
                                  >
                                    {actionLoading === `mark-${reply.id}` ? 'Marcando...' : 'Marcar como Melhor Resposta'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
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
                      <h3 className="text-lg font-semibold mb-4">Sua Resposta</h3>
                      
                      <form onSubmit={handlePostReply} className="space-y-4">
                        <div className="min-h-[128px]">
                          <MarkdownEditor
                            key={`resposta-${editorKey}`}
                            initialContent={mensagem}
                            onChange={(content: string) => setMensagem(content)}
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={enviando || !mensagem.trim()}
                            className="px-6 py-3 rounded-lg bg-[#0E00D0] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-white"
                          >
                            {enviando ? 'Publicando...' : 'Publicar Resposta'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {thread.is_closed && (
                    <div className="text-center py-8 text-gray-400">
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-semibold text-green-400 mb-2">Dúvida Resolvida</h3>
                      <p>Esta discussão foi marcada como resolvida pelo autor.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lightbox para imagens (adicione este componente) */}
            {zoomedImageUrl && (
              <div
                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer"
                onClick={() => setZoomedImageUrl(null)}
              >
                <img
                  src={zoomedImageUrl}
                  alt="Visualização ampliada"
                  className="max-w-[90vw] max-h-[90vh] object-contain"
                  onClick={(e: React.MouseEvent<HTMLImageElement>) => e.stopPropagation()}
                />
                <button
                  onClick={() => setZoomedImageUrl(null)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 cursor-pointer bg-black/50 rounded-full p-2 border border-white/20"
                  aria-label="Fechar"
                >
                  <X size={32} />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
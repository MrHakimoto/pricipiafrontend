// forum/[id]/page.tsx
"use client"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  getForumThreadDetails,
  postForumReply,
  markBestReply,
  reopenThread,
  type ForumThread,
  type ForumReply
} from "@/lib/forum/forum";

const ThreadDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const threadId = params.slug as string;
console.log(threadId)
  useEffect(() => {
    if (status === 'authenticated' && session?.laravelToken && threadId) {
      loadThread();
    }
  }, [threadId]);

  const loadThread = async () => {
    if (!session?.laravelToken) return;
    
    setLoading(true);
    try {
      const data = await getForumThreadDetails(session.laravelToken, threadId);
      setThread(data);
    } catch (error) {
      console.error('Erro ao carregar thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !session?.laravelToken) return;

    setPosting(true);
    try {
      await postForumReply(session.laravelToken, threadId, replyBody);
      setReplyBody('');
      await loadThread();
    } catch (error) {
      console.error('Erro ao postar resposta:', error);
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
      console.error('Erro ao marcar melhor resposta:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenThread = async () => {
    if (!session?.laravelToken) return;
    
    setActionLoading('reopen');
    try {
      await reopenThread(session.laravelToken, threadId);
      await loadThread();
    } catch (error) {
      console.error('Erro ao reabrir thread:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Verificar autenticação
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#00091A] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-400 mb-6">Você precisa estar logado para ver esta discussão.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#0E00D0] hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#00091A] text-white">
        <div className="animate-pulse">
          <div className="h-20 bg-[#1B1F27]"></div>
          <div className="container mx-auto px-4 lg:px-40 py-8 space-y-6">
            <div className="h-8 bg-[#1B1F27] rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
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
            onClick={() => router.push('/forum')}
            className="bg-[#0E00D0] hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            Voltar ao Fórum
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = session?.user?.id === thread.author.id.toString();

  return (
    <div className="min-h-screen bg-[#00091A] text-white">
      {/* Header */}
      <div className="px-8 py-6 border-gray-700 bg-[#1B1F27]">
        <div className="container mx-auto">
          <button
            onClick={() => router.push('/forum')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <motion.div
              whileHover={{ x: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </motion.div>
            Voltar para o Fórum
          </button>
          
          <h1 className="text-lg font-bold">
            Discussão da Dúvida
          </h1>
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
                
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {thread.body}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                  <span>Por {thread.author.name}</span>
                  <span>•</span>
                  <span>{new Date(thread.created_at).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  
                  {thread.linkable_type && (
                    <>
                      <span>•</span>
                      <span className="bg-[#1B1F27] px-3 py-1 rounded-lg border border-[#2F3541]">
                        {thread.linkable_type === 'Questao' ? 'Questão' : 'Aula'} #{thread.linkable_id}
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
                  className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-50 transition-colors"
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
                          <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30">
                            Melhor Resposta
                          </span>
                        )}
                        
                        <span className="text-sm text-gray-400">
                          {new Date(reply.created_at).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {reply.body}
                      </p>
                      
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
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Compartilhe sua solução ou insight sobre esta dúvida..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-[#4A5260] bg-[#00091A] focus:outline-none focus:border-[#0E00D0] transition-colors resize-none"
                  required
                />
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={posting || !replyBody.trim()}
                    className="px-6 py-3 rounded-lg bg-[#0E00D0] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {posting ? 'Publicando...' : 'Publicar Resposta'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {thread.is_closed && (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-green-400 mb-2">Dúvida Resolvida</h3>
              <p>Esta discussão foi marcada como resolvida pelo autor.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ThreadDetail;
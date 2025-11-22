// components/modules/DuvidaCard.tsx
"use client";

import MarkdownEditor from "@/components/editor/MarkDownEditor";
import { motion } from "framer-motion";
import { MessageCircle, Send, Loader2, MessageSquare, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { createForumThread, getForumThreads, type ForumThread, type CreateThreadData } from "@/lib/forum/forum";
import { useSession } from "next-auth/react";
import { ModalDuvidaContent } from "@/components/modules/ModalDuvidaContent"

interface DuvidaQuestaoProps {
    courseContentId?: number;
    enunciado?: string;
    onDuvidaChange?: (duvida: string) => void;
}

export const DuvidaCard: React.FC<DuvidaQuestaoProps> = ({
    courseContentId,
    enunciado = "Este é o conteúdo da aula...",
    onDuvidaChange
}) => {
    const [mensagem, setMensagem] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [threadsRelacionadas, setThreadsRelacionadas] = useState<ForumThread[]>([]);
    const [carregandoThreads, setCarregandoThreads] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [threadSelecionada, setThreadSelecionada] = useState<string>("");
    const { data: session, status } = useSession();

    const token = session?.laravelToken;
    const user = session?.user;

    // Buscar threads relacionadas quando o componente montar ou courseContentId mudar
    useEffect(() => {
        if (courseContentId && token) {
            carregarThreadsRelacionadas();
        }
    }, [courseContentId, token]);

    const carregarThreadsRelacionadas = async () => {
        if (!token || !courseContentId) return;

        setCarregandoThreads(true);
        try {
            const response = await getForumThreads(token, 1);
            // Filtrar threads relacionadas a esta aula
            const threadsDaAula = response.data.filter(thread =>
                thread.linkable_type === "App\\Models\\CourseContent" &&
                thread.linkable_id === courseContentId
            );
            setThreadsRelacionadas(threadsDaAula);
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
            if (onDuvidaChange) {
                onDuvidaChange("");
            }

            // Recarregar a lista de threads relacionadas
            await carregarThreadsRelacionadas();

            // Abrir modal com a nova thread criada
            setThreadSelecionada(novaThread.id.toString());
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
        return new Date(dataString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                className="flex justify-center my-6"
            >
                <div className="bg-[#0e1525] rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-800 overflow-hidden">

                    {/* Cabeçalho */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700">
                        <MessageCircle className="text-blue-500" size={24} />
                        <div className="flex flex-col">
                            <h3 className="text-white font-semibold text-lg">Tire sua Dúvida</h3>
                            <p className="text-gray-400 text-sm">Nossa equipe de especialistas vai te ajudar</p>
                        </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-6">
                        {/* Preview da Aula */}
                        <div className="bg-[#131b2d] rounded-lg p-4 mb-4 border border-gray-700">
                            <h4 className="text-white font-medium mb-2">Aula #{courseContentId}</h4>
                            <p className="text-gray-300 text-sm line-clamp-3">
                                {enunciado.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                        </div>

                        {/* Threads Relacionadas */}
                        {threadsRelacionadas.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-white font-medium flex items-center gap-2">
                                        <MessageSquare size={18} />
                                        Dúvidas Relacionadas ({threadsRelacionadas.length})
                                    </h4>
                                    <button
                                        onClick={handleNovaDuvida}
                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
                                    >
                                        <MessageCircle size={14} />
                                        Nova Dúvida
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {threadsRelacionadas.map((thread) => (
                                        <div
                                            key={thread.id}
                                            className="bg-[#131b2d] rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-all duration-200 cursor-pointer group"
                                            onClick={() => handleAbrirDiscussao(thread.id.toString())}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="text-white font-medium text-sm group-hover:text-blue-300 transition-colors">
                                                    {thread.title}
                                                </h5>
                                                <div className="flex gap-2">
                                                    <span className={`text-xs px-2 py-1 rounded ${thread.is_closed
                                                        ? 'bg-green-500/20 text-green-300'
                                                        : 'bg-blue-500/20 text-blue-300'
                                                        }`}>
                                                        {thread.is_closed ? 'Resolvido' : 'Aberto'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                                                {thread.body}
                                            </p>
                                            <div className="flex justify-between items-center text-xs text-gray-400">
                                                <div className="flex items-center gap-4">
                                                    <span>Por: {thread.author.name}</span>
                                                    <span>•</span>
                                                    <span>{formatarData(thread.created_at)}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500">
                                                        {contarRespostas(thread)} resposta{contarRespostas(thread) !== 1 ? 's' : ''}
                                                    </span>
                                                    <Eye size={14} className="text-gray-500" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {carregandoThreads && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="animate-spin text-blue-500" size={20} />
                            </div>
                        )}

                        {/* Se não há threads relacionadas, mostrar botão para nova dúvida */}
                        {threadsRelacionadas.length === 0 && !carregandoThreads && (
                            <div className="mb-6 text-center py-4">
                                <MessageSquare className="mx-auto text-gray-500 mb-2" size={32} />
                                <p className="text-gray-400 text-sm mb-4">
                                    Nenhuma dúvida sobre esta aula ainda.
                                </p>
                                <button
                                    onClick={handleNovaDuvida}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                                >
                                    <MessageCircle size={16} />
                                    Ser o primeiro a perguntar
                                </button>
                            </div>
                        )}

                        {/* Formulário de Dúvida */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">
                                    Sua Dúvida *
                                </label>

                                <MarkdownEditor
                                    editorStyle={{ height: "180px" }}
                                    initialContent={mensagem}
                                    onChange={handleMensagemChange}
                                />
                            </div>

                            {/* Dicas */}
                            <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-700">
                                <div className="flex items-center gap-2 text-yellow-300 text-sm font-medium mb-1">
                                    <span>💡</span>
                                    Dicas para uma boa pergunta:
                                </div>
                                <ul className="text-yellow-200 text-xs space-y-1">
                                    <li>• Seja específico sobre o que não entendeu</li>
                                    <li>• Mencione o passo onde tem dificuldade</li>
                                    <li>• Compartilhe seu raciocínio atual</li>
                                </ul>
                            </div>

                            {/* Botão Enviar */}
                            <button
                                onClick={handleEnviarDuvida}
                                disabled={!mensagem.trim() || enviando}
                                className="cursor-pointer w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
                        <div className="mt-4 text-center text-gray-400 text-xs">
                            <p>⌛ Resposta em até 24 horas</p>
                            <p>Resposta por especialistas da matéria</p>
                        </div>
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
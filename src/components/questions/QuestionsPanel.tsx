// components/questions/QuestionsPanel.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Questao, Alternativa, Topico } from '@/types/list';
import { Newspaper, ChartColumn, MessageCircle, ChevronDown, ChevronUp, HelpCircle, Loader2 } from 'lucide-react'; // Adicionei Loader2
import { AnswerFeedbackOverlay } from '@/components/questions/AnswerFeedbackOverlay';
import { salvarResposta } from '@/lib/questions/tentativa';
import { useNavigation } from '@/contexts/NavigationContext';
import { QuestionWrapper } from './QuestionWrapper';
import { GabaritoQuestao } from "./feedback/gabarito";
import { DuvidaQuestao } from "./feedback/duvida";
import { EstatisticasQuestao } from "./feedback/estatisticas";
import { motion, AnimatePresence } from "framer-motion";
import ReportarModal from "@/components/questions/ReportModal";
import OpcoesQuestao from "@/components/questions/OpcoesQuestao";
import { useSession } from "next-auth/react";
import type { NavigationQuestion } from '@/components/questions/CurseList';
import type { QuestaoBase } from '@/types/questions';
import { RefazerListaButton } from "./RefazerListaButton";
import { processMarkdown } from "@/utils/markdownProcessor";
import { markdownProcessorAlternativas } from "@/utils/markdownProcessorAlternativas";
import { MultipleQuestionSkeleton } from "../Skeletons/QuestionSkeleton";
import { ImageLightbox } from "@/components/editor/ImageLightbox";

// Componente de Alternativa
type SimpleAlternativa = {
    id: number;
    letra: string;
    texto: string;
    processedText?: string;
};

type QuizOptionProps = {
    alternativa: SimpleAlternativa;
    questaoId: number;
    alternativaCorretaId: number;
    selecaoAtual: number | null;
    statusResposta: 'unanswered' | 'correct' | 'incorrect';
    onSelect: (alternativaId: number) => void;
};

const QuizOption = ({
    alternativa,
    questaoId,
    alternativaCorretaId,
    selecaoAtual,
    statusResposta,
    onSelect
}: QuizOptionProps) => {
    const [isCut, setIsCut] = useState(false);
    const [showScissors, setShowScissors] = useState(false);

    const isSelected = selecaoAtual === alternativa.id;
    const isSubmitted = statusResposta !== 'unanswered';
    const isCorrectAnswer = alternativa.id === alternativaCorretaId;

    // Classes base
    let optionClass = 'hover:bg-blue-800 cursor-pointer transition-all duration-200';
    let optionClass2 = 'flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-600 text-white mr-3 text-base font-bold transition-all duration-200 flex-shrink-0';
    let textClass = 'text-white font-light transition-all duration-200';

    // Ajustes para estado selecionado
    if (isSelected && !isSubmitted) {
        optionClass = 'bg-blue-900 border-blue-500';
        optionClass2 = 'flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-500 text-white mr-3 text-base font-bold transition-all duration-200 bg-blue-900 flex-shrink-0';
    }

    // Ajustes para resposta submetida
    if (isSubmitted) {
        if (isCorrectAnswer) {
            optionClass = 'bg-green-900 border-green-500 cursor-default';
            optionClass2 = 'flex items-center justify-center w-8 h-8 rounded-full border-2 border-green-500 text-white mr-3 text-base font-bold transition-all duration-200 bg-green-900 flex-shrink-0';
        } else if (isSelected && !isCorrectAnswer) {
            optionClass = 'bg-red-900 border-red-500 cursor-default';
            optionClass2 = 'flex items-center justify-center w-8 h-8 rounded-full border-2 border-red-500 text-white mr-3 text-base font-bold transition-all duration-200 bg-red-900 flex-shrink-0';
        } else {
            optionClass = 'cursor-default opacity-70';
        }
    }

    // Efeito de "cortado"
    if (isCut) {
        optionClass += ' opacity-40';
        textClass += ' line-through text-gray-400';
    }

    const handleToggleCut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCut(!isCut);
    };

    const handleSelect = () => {
        if (!isSubmitted) {
            if (isCut) {
                // Se estiver cortada, clicar remove o corte
                setIsCut(false);
            } else {
                // Se não estiver cortada, seleciona normalmente
                onSelect(alternativa.id);
            }
        }
    };

    return (
        <div
            onClick={handleSelect}
            onMouseEnter={() => !isSubmitted && setShowScissors(true)}
            onMouseLeave={() => setShowScissors(false)}
            className={`flex items-center p-3 my-2 rounded-lg border-2 border-transparent relative group ${optionClass}`}
        >
            {/* Letra da alternativa */}
            <div className={optionClass2}>
                {alternativa.letra.toUpperCase()}
            </div>

            {/* Texto da alternativa */}
            <div
                className={`${textClass} markdown-body wmde-markdown wmde-markdown-color flex-1 min-w-0 overflow-hidden pr-2`}
                style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem',
                    '--color-canvas-default': 'transparent',
                    '--color-fg-default': isCut ? '#9CA3AF' : 'currentColor'
                } as React.CSSProperties}
                dangerouslySetInnerHTML={{
                    __html: alternativa.processedText || alternativa.texto
                }}
            />

            {/* Botão de cortar (lado direito - aparece ao passar o mouse) */}
            {!isSubmitted && showScissors && (
                <button
                    onClick={handleToggleCut}
                    className="flex-shrink-0 ml-2 bg-gray-800 hover:bg-gray-700 rounded-full p-1.5 
                             border border-gray-600 shadow-lg transition-all duration-200 z-10"
                    title={isCut ? "Recuperar alternativa" : "Cortar alternativa"}
                >
                    <svg
                        className={`w-4 h-4 ${isCut ? 'text-green-400 hover:text-green-300' : 'text-gray-300 hover:text-white'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        {isCut ? (
                            // Ícone de restaurar (seta de voltar)
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        ) : (
                            // Ícone de tesoura
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                        )}
                    </svg>
                </button>
            )}
        </div>
    );
};

// Tipos para as abas
type QuestaoTab = 'gabarito' | 'duvida' | 'estatisticas' | null;

// Props do QuestionsPanel
interface QuestionsPanelProps {
    questions: QuestaoBase[];
    className?: string;
    resolucaoId: number | null;
    respostasSalvas: Record<number, number>;
    onIniciarTentativa: () => Promise<number>;
    listaId?: number;
    listaTipo?: string;
}

// Componente Principal
export const QuestionsPanel: React.FC<QuestionsPanelProps> = ({
    questions,
    className = "",
    resolucaoId: propResolucaoId,
    respostasSalvas,
    onIniciarTentativa,
    listaId,
    listaTipo
}) => {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
    const [answeredQuestions, setAnsweredQuestions] = useState<Record<number, boolean>>({});
    const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
    const [activeTabs, setActiveTabs] = useState<Record<number, QuestaoTab>>({});
    const [openReportModalId, setOpenReportModalId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState<Record<number, boolean>>({});
    const [currentResolucaoId, setCurrentResolucaoId] = useState<number | null>(propResolucaoId);
    const [topicsVisible, setTopicsVisible] = useState(false);

    const { todasQuestoesRespondidas, progresso } = useNavigation();
    const [tentativaFinalizada, setTentativaFinalizada] = useState(false);

    const [isRefazendoLista, setIsRefazendoLista] = useState(false);
    const { data: session, status } = useSession();
    const userToken = session?.laravelToken!
    const { updateQuestionStatus } = useNavigation();
    // Dentro do componente QuestionsPanel, junto com os outros estados
    const [processedContent, setProcessedContent] = useState<Record<number, {
        enunciado: string;
        alternativas: Record<number, string>;
    }>>({});
    const [isProcessingContent, setIsProcessingContent] = useState(true);
    const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
    const isSimuladoOuProva = listaTipo && ['simulado', 'prova'].includes(listaTipo);

    useEffect(() => {
        if (respostasSalvas && Object.keys(respostasSalvas).length > 0) {
            console.log('🔄 Carregando respostas salvas:', respostasSalvas);

            const newAnsweredQuestions: Record<number, boolean> = {};
            Object.keys(respostasSalvas).forEach(questaoId => {
                const id = parseInt(questaoId);
                newAnsweredQuestions[id] = true;

                // Atualizar contexto de navegação
                const questao = questions.find(q => q.id === id);
                if (questao) {
                    const isCorrect = respostasSalvas[id] === questao.alternativa_correta_id;
                    updateQuestionStatus(id, isCorrect ? 'correct' : 'incorrect');
                }
            });

            setSelectedAnswers(respostasSalvas);
            setAnsweredQuestions(newAnsweredQuestions);
        }
    }, [respostasSalvas, questions, updateQuestionStatus]);



    // ZOOM DE IMAGEM!!!

    useEffect(() => {
        const handleImageClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Verificar se o clique foi em uma imagem
            if (target.tagName === 'IMG') {
                // Verificar se NÃO está em um menu do usuário, notificações, ou nav
                const isInUserMenu = target.closest('[class*="UserMenu"]') ||
                    target.closest('[class*="user-menu"]') ||
                    target.closest('[class*="notification"]') ||
                    target.closest('nav') ||
                    target.closest('button') ||
                    target.closest('[role="menu"]') ||
                    target.closest('[role="dialog"]');

                // Verificar se está no conteúdo das questões
                const isInQuestionContent = target.closest('.markdown-body') ||
                    target.closest('[class*="question"]') ||
                    target.closest('[class*="questao"]') ||
                    target.closest('[class*="gabarito"]') ||
                    target.closest('[class*="alternativa"]') ||
                    target.closest('[class*="explicacao"]');

                // Só abrir lightbox se estiver no conteúdo da questão e NÃO em um menu
                if (isInQuestionContent && !isInUserMenu) {
                    const src = target.getAttribute('src');
                    if (src) {
                        setZoomedImageUrl(src);
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            }
        }

        // Usar capture: true para pegar o evento antes dos menus
        document.addEventListener('click', handleImageClick, true);

        return () => {
            document.removeEventListener('click', handleImageClick, true);
        };
    }, []);

    const closeLightbox = useCallback(() => {
        setZoomedImageUrl(null);
    }, []);

    useEffect(() => {
        if (currentResolucaoId === null && Object.keys(respostasSalvas).length > 0) {
            console.log('🎯 Tentativa finalizada detectada - mostrando botão refazer');
            setTentativaFinalizada(true);
        } else {
            setTentativaFinalizada(false);
        }
    }, [currentResolucaoId, respostasSalvas]);



    const handleRefazerLista = async () => {
        setIsRefazendoLista(true);

        try {
            console.log('🔄 Iniciando nova tentativa para refazer lista...');

            // Cria nova tentativa no backend
            const novaResolucaoId = await onIniciarTentativa();

            // Recarrega a página para buscar os dados frescos
            window.location.reload();

        } catch (error) {
            console.error('❌ Erro ao refazer lista:', error);
            alert('Erro ao reiniciar a lista. Tente novamente.');
            setIsRefazendoLista(false);
        }
    };

    const deveMostrarBotaoRefazer = useMemo(() => {
        console.log('🔍 Verificando se deve mostrar botão:', {
            todasQuestoesRespondidas,
            tentativaFinalizada,
            currentResolucaoId,
            respostasSalvasCount: Object.keys(respostasSalvas).length,
            questionsCount: questions.length
        });

        // CASO 1: Todas as questões foram respondidas E a tentativa ainda está ativa
        if (todasQuestoesRespondidas && currentResolucaoId) {
            console.log('✅ Mostrar botão: Todas questões respondidas + tentativa ativa');
            return true;
        }

        // CASO 2: Tentativa foi FINALIZADA no backend (mais comum)
        if (tentativaFinalizada) {
            console.log('✅ Mostrar botão: Tentativa finalizada no backend');
            return true;
        }

        console.log('❌ Não mostrar botão');
        return false;
    }, [todasQuestoesRespondidas, tentativaFinalizada, currentResolucaoId, respostasSalvas, questions.length]);


    useEffect(() => {
        setCurrentResolucaoId(propResolucaoId);
    }, [propResolucaoId]);

    // Logo após os outros useEffects no componente QuestionsPanel
    useEffect(() => {
        const processQuestionsContent = async () => {
            setIsProcessingContent(true);
            const contentMap: Record<number, {
                enunciado: string;
                alternativas: Record<number, string>;
            }> = {};

            for (const questao of questions) {
                try {
                    // Processar enunciado (usa processMarkdown)
                    const enunciadoProcessado = await processMarkdown(questao.enunciado);

                    // Processar cada alternativa (usa markdownProcessorAlternativas)
                    const alternativasProcessadas: Record<number, string> = {};
                    for (const alternativa of questao.alternativas) {
                        // USANDO O PROCESSADOR DE ALTERNATIVAS AQUI!
                        const altProcessada = await markdownProcessorAlternativas(alternativa.texto);
                        alternativasProcessadas[alternativa.id] = altProcessada;
                    }

                    contentMap[questao.id] = {
                        enunciado: enunciadoProcessado,
                        alternativas: alternativasProcessadas
                    };
                } catch (error) {
                    console.error(`Erro ao processar conteúdo da questão ${questao.id}:`, error);
                    contentMap[questao.id] = {
                        enunciado: questao.enunciado,
                        alternativas: questao.alternativas.reduce((acc, alt) => {
                            acc[alt.id] = alt.texto;
                            return acc;
                        }, {} as Record<number, string>)
                    };
                }
            }

            setProcessedContent(contentMap);
            setIsProcessingContent(false);
        };

        processQuestionsContent();
    }, [questions]);




    const handleSelectAnswer = (questionId: number, alternativaId: number) => {
        if (answeredQuestions[questionId]) return;

        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: alternativaId,
        }));
    };

    const handleConfirmAnswer = async (questionId: number, alternativaCorretaId: number) => {
        const selectedId = selectedAnswers[questionId];
        if (selectedId === undefined || selectedId === null) return;

        let resolucaoId = currentResolucaoId;

        setIsSaving(prev => ({ ...prev, [questionId]: true }));

        try {
            // 🔑 LÓGICA CHAVE: Se não há tentativa, criar uma
            if (!resolucaoId) {
                console.log('🆕 Primeira resposta - criando tentativa...');
                resolucaoId = await onIniciarTentativa();
                setCurrentResolucaoId(resolucaoId);
            }

            // Salvar resposta no backend
            console.log('💾 Salvando resposta:', { resolucaoId, questionId, selectedId });
            const resultado = await salvarResposta(resolucaoId!, questionId, selectedId, userToken);
            console.log('✅ Resposta salva com sucesso:', resultado);

            const isCorrect = selectedId === alternativaCorretaId;

            // Atualizar estado local
            setAnsweredQuestions(prev => ({
                ...prev,
                [questionId]: true
            }));

            if (!isSimuladoOuProva) {

                setShowFeedback(prev => ({
                    ...prev,
                    [questionId]: true
                }));

                // Atualizar contexto de navegação
                updateQuestionStatus(questionId, isCorrect ? 'correct' : 'incorrect');

                // Remover feedback após 2 segundos
                setTimeout(() => {
                    setShowFeedback(prev => ({
                        ...prev,
                        [questionId]: false
                    }));
                }, 2000);

            } else {

                updateQuestionStatus(questionId, 'answered');

                console.log('🎯 Simulado/Prova: Feedback não mostrado ao usuário');
            }

        } catch (error) {
            console.error('❌ Erro ao salvar resposta:', error);
            alert('Erro ao salvar resposta. Tente novamente.');
        } finally {
            setIsSaving(prev => ({ ...prev, [questionId]: false }));
        }
    }; // ✅ REMOVI o ponto e vírgula problemático aqui

    const openReportModal = (questaoId: number) => {
        setOpenReportModalId(questaoId);
    };

    const closeReportModal = () => {
        setOpenReportModalId(null);
    };

    const toggleTab = (questionId: number, tab: QuestaoTab) => {
        setActiveTabs(prev => {
            const currentTab = prev[questionId];
            if (currentTab === tab) {
                const newState = { ...prev };
                delete newState[questionId];
                return newState;
            } else {
                return {
                    ...prev,
                    [questionId]: tab
                };
            }
        });
    };

    const toggleTopics = (questionId: number) => {
        setTopicsVisible(prev => !prev);
    };

    const isQuestionAnswered = (questionId: number) => {
        return answeredQuestions[questionId] || false;
    };

    const getTabIcon = (questionId: number, tab: QuestaoTab) => {
        const isActive = activeTabs[questionId] === tab;
        return isActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    };

    // FUNÇÃO ADICIONADA: Badge de dificuldade
    const getDifficultyBadge = (dificuldade?: number) => {
        switch (dificuldade) {
            case 1:
                return <div className="border-2 border-green-400 bg-green-100 text-green-800 rounded-lg px-3 py-1 text-sm font-semibold">Muito Fácil</div>;
            case 2:
                return <div className="border-2 border-lime-400 bg-lime-100 text-lime-800 rounded-lg px-3 py-1 text-sm font-semibold">Fácil</div>;
            case 3:
                return <div className="border-2 border-yellow-400 bg-yellow-100 text-yellow-800 rounded-lg px-3 py-1 text-sm font-semibold">Médio</div>;
            case 4:
                return <div className="border-2 border-orange-500 bg-orange-100 text-orange-800 rounded-lg px-3 py-1 text-sm font-semibold">Difícil</div>;
            case 5:
                return <div className="border-2 border-red-500 bg-red-100 text-red-800 rounded-lg px-3 py-1 text-sm font-semibold">Muito Difícil</div>;
            default:
                return null;
        }
    };

    const renderActiveTabContent = (questao: QuestaoBase) => {
        const activeTab = activeTabs[questao.id];

        if (!activeTab) return null;

        const content = {
            gabarito: (
                <GabaritoQuestao
                    questaoId={questao.id}
                    gabaritoVideo={questao.gabarito_video || undefined}
                    gabaritoComentado={questao.gabarito_comentado_texto}
                />
            ),
            duvida: (
                <DuvidaQuestao
                    questaoId={questao.id}
                    enunciado={questao.enunciado}
                />
            ),
            estatisticas: (
                <EstatisticasQuestao
                    questaoId={questao.id}
                    dificuldade={questao.dificuldade}
                    token={userToken}
                />
            )
        };

        return content[activeTab];
    };

    console.log('QuestionsPanel estado:', {
        questionsCount: questions.length,
        currentResolucaoId,
        respostasSalvasCount: Object.keys(respostasSalvas).length,
        selectedAnswersCount: Object.keys(selectedAnswers).length,
        answeredQuestionsCount: Object.keys(answeredQuestions).length
    });
    return (
        <div className={`flex-1 flex flex-col min-h-0 ${className}`}>
            {/* Container das questões com scroll próprio */}
            <div className="flex-1 overflow-y-auto">
                {isProcessingContent ? (
                    <MultipleQuestionSkeleton count={questions.length} />
                ) : (

                    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-2 lg:pt-6">
                        <main>
                            {todasQuestoesRespondidas && (
                                <div className="fixed bottom-6 right-6 z-50">
                                    <motion.button
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20
                                        }}
                                        onClick={handleRefazerLista}
                                        className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-bold text-sm sm:text-lg flex items-center gap-2 border-2 border-green-500 hover:shadow-xl transform hover:scale-105"
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refazer Lista
                                    </motion.button>
                                </div>
                            )}
                            {questions.map((questao, index) => (
                                <QuestionWrapper key={questao.id}
                                    questionId={questao.id}>

                                    <div
                                        className="bg-[#00091A] rounded-lg shadow-xl mb-6 sm:mb-8 border border-[#616161]"
                                    >
                                        {/* Cabeçalho da Questão - MODIFICADO */}
                                        <div className="w-full bg-blue-950 border-b border-gray-700">
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-gray-800 overflow-hidden w-full">
                                                <div className="bg-gradient-to-br from-[#1F293C] to-[#2D3748] text-white px-3 py-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 flex-shrink-0">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs text-gray-400 font-medium">QUESTÃO</span>
                                                        <span className="text-xl sm:text-2xl font-bold text-white">{index + 1}</span>
                                                    </div>
                                                    <div className="h-8 w-px bg-gray-600"></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs text-gray-400 font-medium">ID</span>
                                                        <span className="text-base sm:text-lg font-semibold text-blue-300">#{questao.id}</span>
                                                    </div>
                                                </div>

                                                <div className="flex-grow rounded-bl-md sm:rounded-bl-none sm:rounded-l-md relative bg-white text-gray-800 px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-between">


                                                    <div className="text-sm sm:text-base font-medium">
                                                        <button onClick={() => toggleTopics(questao.id)} className="cursor-pointer text-blue-800 hover:text-blue-600 flex items-center gap-1 sm:gap-2">
                                                            {topicsVisible ? <>Ocultar tópicos <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /></> : <>Ver tópicos <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" /></>}
                                                        </button>

                                                        <AnimatePresence>
                                                            {topicsVisible && questao.topicos && (
                                                                <motion.div
                                                                    initial={{ x: 100, opacity: 0 }}
                                                                    animate={{ x: 0, opacity: 1 }}
                                                                    exit={{ x: 100, opacity: 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                    className="absolute top-0 right-0 h-full bg-blue-900 text-white text-xs sm:text-sm 
                 px-2 py-2 sm:px-4 sm:py-3 
                 flex items-center gap-1 sm:gap-2 
                 rounded-l-xl shadow-lg"
                                                                >
                                                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">

                                                                        {questao.topicos.map(t => (
                                                                            <span
                                                                                key={t.id}
                                                                                className="bg-blue-700 text-white text-xs font-semibold 
                       px-1.5 py-0.5 sm:px-2 sm:py-1 
                       rounded-full whitespace-nowrap shadow-md"
                                                                            >
                                                                                {t.nome}
                                                                            </span>
                                                                        ))}

                                                                        <div className="ml-1 sm:ml-3">
                                                                            {getDifficultyBadge(questao.dificuldade)}
                                                                        </div>

                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metadados */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-sm font-medium my-2 px-4 sm:px-6 border-b border-white pb-3 sm:pb-4">

                                            {/* Badges da Prova */}
                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                {questao.prova?.sigla && (
                                                    <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-gray-300 text-xs sm:text-sm">
                                                        {questao.prova.sigla}
                                                    </span>
                                                )}
                                                {questao.prova?.ano && (
                                                    <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-gray-300 text-xs sm:text-sm">
                                                        {questao.prova.ano}
                                                    </span>

                                                )}
                                                {questao.adaptado && (

                                                    <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-gray-300 text-xs sm:text-sm">
                                                        (Questão Adapitada)
                                                    </span>)
                                                }
                                            </div>


                                            <div className="mt-1 sm:mt-0">
                                                <OpcoesQuestao
                                                    questao={questao}
                                                    onReport={() => openReportModal(questao.id)}
                                                />
                                            </div>
                                        </div>

                                        {/* Corpo da Questão */}
                                        <section className="p-4 sm:p-6 relative">
                                            <div
                                                className="text-gray-200 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base markdown-body wmde-markdown wmde-markdown-color"
                                                style={{
                                                    lineHeight: '1.25rem',
                                                    '--color-canvas-default': 'transparent',
                                                    '--color-fg-default': 'currentColor'
                                                } as React.CSSProperties}
                                                dangerouslySetInnerHTML={{
                                                    __html: processedContent[questao.id]?.enunciado || questao.enunciado
                                                }}
                                            />

                                            {/* Alternativas */}
                                            <div className="relative">
                                                {questao.alternativas.map((alt) => {
                                                    const altComProcessado = {
                                                        ...alt,
                                                        processedText: processedContent[questao.id]?.alternativas[alt.id]
                                                    };

                                                    return (
                                                        <QuizOption
                                                            key={alt.id}
                                                            alternativa={altComProcessado}
                                                            questaoId={questao.id}
                                                            alternativaCorretaId={questao.alternativa_correta_id}
                                                            selecaoAtual={selectedAnswers[questao.id] || null}
                                                            statusResposta={isQuestionAnswered(questao.id) ?
                                                                (isSimuladoOuProva ? 'unanswered' :
                                                                    (selectedAnswers[questao.id] === questao.alternativa_correta_id ? 'correct' : 'incorrect'))
                                                                : 'unanswered'
                                                            }
                                                            onSelect={(alternativaId) => handleSelectAnswer(questao.id, alternativaId)}
                                                        />
                                                    );
                                                })}
                                            </div>

                                            {/* Botão Responder */}
                                            <div className="flex justify-end mt-4">
                                                <button
                                                    onClick={() => handleConfirmAnswer(questao.id, questao.alternativa_correta_id)}
                                                    disabled={isQuestionAnswered(questao.id) || selectedAnswers[questao.id] == null}
                                                    className="cursor-pointer px-6 sm:px-8 py-2 sm:py-3 bg-[#0E00D0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-sm sm:text-base font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                                >
                                                    {isSaving[questao.id] ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                                                            Salvando...
                                                        </span>
                                                    ) : (
                                                        'Responder'
                                                    )}
                                                </button>
                                            </div>

                                        </section>

                                        {/* Rodapé e Ações - AGORA EM UMA LINHA SÓ */}
                                        <div className="w-full bg-gray-800 rounded-b-lg">
                                            <div className="w-full rounded-lg overflow-hidden flex flex-row flex-wrap justify-around items-center py-3 sm:py-4">
                                                {/* Botão Gabarito Comentado */}
                                                <button
                                                    onClick={() => toggleTab(questao.id, 'gabarito')}
                                                    disabled={!isQuestionAnswered(questao.id)}
                                                    className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 sm:p-3 transition duration-200 ease-in-out flex-1 min-w-[120px] text-center space-x-1 sm:space-x-2 ${activeTabs[questao.id] === 'gabarito'
                                                        ? 'text-white bg-blue-900'
                                                        : 'text-gray-300 hover:text-white'
                                                        }`}
                                                >
                                                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    <span className="text-xs sm:text-sm md:text-base">Gabarito</span>
                                                    {getTabIcon(questao.id, 'gabarito')}
                                                </button>

                                                {/* Botão Estatísticas */}
                                                <button
                                                    onClick={() => toggleTab(questao.id, 'estatisticas')}
                                                    disabled={!isQuestionAnswered(questao.id)}
                                                    className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 sm:p-3 transition duration-200 ease-in-out flex-1 min-w-[120px] text-center border-l border-gray-700 space-x-1 sm:space-x-2 ${activeTabs[questao.id] === 'estatisticas'
                                                        ? 'text-white bg-blue-900'
                                                        : 'text-gray-300 hover:text-white'
                                                        }`}

                                                >
                                                    <ChartColumn className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    <span className="text-xs sm:text-sm md:text-base">Estatísticas</span>
                                                    {getTabIcon(questao.id, 'estatisticas')}
                                                </button>

                                                {/* Botão Dúvida */}
                                                <button
                                                    onClick={() => toggleTab(questao.id, 'duvida')}
                                                    disabled={!isQuestionAnswered(questao.id)}
                                                    className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 sm:p-3 transition duration-200 ease-in-out flex-1 min-w-[120px] text-center border-l border-gray-700 space-x-1 sm:space-x-2 ${activeTabs[questao.id] === 'duvida'
                                                        ? 'text-white bg-blue-900'
                                                        : 'text-gray-300 hover:text-white'
                                                        }`}
                                                >
                                                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    <span className="text-xs sm:text-sm md:text-base">Dúvida</span>
                                                    {getTabIcon(questao.id, 'duvida')}
                                                </button>
                                            </div>

                                            {/* Conteúdo das Abas com Animação */}
                                            <AnimatePresence>
                                                {activeTabs[questao.id] && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                                                            {renderActiveTabContent(questao)}
                                                        </div>
                                                    </motion.div>
                                                )}

                                            </AnimatePresence>
                                            {openReportModalId && (
                                                <ReportarModal
                                                    questaoId={openReportModalId}
                                                    onClose={closeReportModal}
                                                    token={userToken || ""}
                                                />
                                            )}
                                        </div>
                                    </div>

                                </QuestionWrapper>
                            ))}
                        </main>
                    </div>
                )}
            </div>
            {deveMostrarBotaoRefazer && (
                <RefazerListaButton
                    onRefazerLista={handleRefazerLista}
                    isLoading={isRefazendoLista}
                    isTentativaFinalizada={tentativaFinalizada}
                />
            )}
            {zoomedImageUrl && (
                <ImageLightbox
                    imageUrl={zoomedImageUrl}
                    onClose={closeLightbox}
                />
            )}

        </div>

    );
};
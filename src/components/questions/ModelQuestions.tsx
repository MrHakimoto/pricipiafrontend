// components/questions/ModelQuesitons.tsx
'use client';

import { useState, useRef, useEffect } from "react";
import type { Questao, Alternativa, Topico } from '@/types/list';
import { MessageCircle, ChartColumn, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AnswerFeedbackOverlay } from '@/components/questions/AnswerFeedbackOverlay';
//import { useNavigation } from '@/contexts/NavigationContext';
import { QuestionWrapper } from './QuestionWrapper';
import { GabaritoQuestao } from "./feedback/gabarito";
import { DuvidaQuestao } from "./feedback/duvida";
import { EstatisticasQuestao } from "./feedback/estatisticas";
import { motion, AnimatePresence } from "framer-motion";
import ReportarModal from "@/components/questions/ReportModal";
import OpcoesQuestao from "@/components/questions/OpcoesQuestao";
import { useSession } from "next-auth/react";

// Componente de Alternativa
type QuizOptionProps = {
  alternativa: Alternativa;
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
  const isSelected = selecaoAtual === alternativa.id;
  const isSubmitted = statusResposta !== 'unanswered';
  const isCorrectAnswer = alternativa.id === alternativaCorretaId;

  let optionClass = 'hover:bg-blue-800 cursor-pointer';
  let optionClass2 = 'flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-600 text-white mr-4 text-xl font-bold transition-all duration-200';

  if (isSelected && !isSubmitted) {
    optionClass = 'bg-blue-900 border-blue-500';
    optionClass2 = 'flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-500 text-white mr-4 text-xl font-bold transition-all duration-200 bg-blue-900';
  }

  if (isSubmitted) {
    if (isCorrectAnswer) {
      optionClass = 'bg-green-900 border-green-500 cursor-default';
      optionClass2 = 'flex items-center justify-center w-12 h-12 rounded-full border-2 border-green-500 text-white mr-4 text-xl font-bold transition-all duration-200 bg-green-900';
    } else if (isSelected && !isCorrectAnswer) {
      optionClass = 'bg-red-900 border-red-500 cursor-default';
      optionClass2 = 'flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-500 text-white mr-4 text-xl font-bold transition-all duration-200 bg-red-900';
    } else {
      optionClass = 'cursor-default opacity-70';
    }
  }

  return (
    <div
      onClick={() => !isSubmitted && onSelect(alternativa.id)}
      className={`flex items-center p-4 my-3 rounded-lg transition-all duration-200 border-2 border-transparent ${optionClass}`}
    >
      <div className={optionClass2}>
        {alternativa.letra.toUpperCase()}
      </div>
      <span className="text-white text-lg font-light">{alternativa.texto}</span>
    </div>
  );
};

// Tipos para as abas
type QuestaoTab = 'gabarito' | 'duvida' | 'estatisticas' | null;

// Props do QuestionsPanel
interface QuestionsPanelProps {
  questions: Questao[];
  className?: string;
}

// Hook personalizado para gerenciar o estado das questões
const useQuestoesState = (questions: Questao[]) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<number, boolean>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<number, QuestaoTab>>({});
  const [openReportModalId, setOpenReportModalId] = useState<number | null>(null);
  const [topicsVisible, setTopicsVisible] = useState<Record<number, boolean>>({});

  //const { updateQuestionStatus } = useNavigation();
  const timeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleSelectAnswer = (questionId: number, alternativaId: number) => {
    if (answeredQuestions[questionId]) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: alternativaId,
    }));
  };

  const handleConfirmAnswer = (questionId: number, alternativaCorretaId: number) => {
    const selectedId = selectedAnswers[questionId];
    if (selectedId === undefined || selectedId === null) return;

    const isCorrect = selectedId === alternativaCorretaId;

    // Marca como respondida e mostra feedback
    setAnsweredQuestions(prev => ({
      ...prev,
      [questionId]: true
    }));

    setShowFeedback(prev => ({
      ...prev,
      [questionId]: true
    }));

    // Atualiza contexto de navegação
    //updateQuestionStatus(questionId, isCorrect ? 'correct' : 'incorrect');

    // Remove o feedback após 2 segundos
    const timeoutId = setTimeout(() => {
      setShowFeedback(prev => ({
        ...prev,
        [questionId]: false
      }));
    }, 2000);

    // Armazena o timeout para cleanup
    timeoutsRef.current[questionId] = timeoutId;
  };

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
    setTopicsVisible(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const isQuestionAnswered = (questionId: number) => {
    return answeredQuestions[questionId] || false;
  };

  return {
    selectedAnswers,
    answeredQuestions,
    showFeedback,
    activeTabs,
    openReportModalId,
    topicsVisible,
    handleSelectAnswer,
    handleConfirmAnswer,
    openReportModal,
    closeReportModal,
    toggleTab,
    toggleTopics,
    isQuestionAnswered
  };
};

// Componente de Cabeçalho da Questão
const QuestaoHeader = ({
  questao,
  index,
  topicsVisible,
  onToggleTopics
}: {
  questao: Questao;
  index: number;
  topicsVisible: boolean;
  onToggleTopics: () => void;
}) => {
  return (
    <div className="w-full bg-blue-950 border-b border-gray-700">
      <div className="flex items-center bg-gray-800 overflow-hidden w-full">
        <div className="bg-gradient-to-br from-[#1F293C] to-[#2D3748] text-white px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 font-medium">QUESTÃO</span>
            <span className="text-2xl font-bold text-white">{index + 1}</span>
          </div>
          <div className="h-8 w-px bg-gray-600"></div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 font-medium">ID</span>
            <span className="text-lg font-semibold text-blue-300">#{questao.id}</span>
          </div>
        </div>

        <div className="flex-grow rounded-l-md relative bg-white text-xl text-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="text-lg font-medium">
            <button
              onClick={onToggleTopics}
              className="cursor-pointer text-blue-800 hover:text-blue-600 flex items-center gap-2"
            >
              {topicsVisible ? (
                <>Ocultar tópicos <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Ver tópicos <ChevronDown className="w-4 h-4" /></>
              )}
            </button>

            <AnimatePresence>
              {topicsVisible && questao.topicos && (
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-0 right-0 h-full bg-blue-900 text-white text-sm px-4 py-3 flex items-center gap-2 rounded-l-xl shadow-lg"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {questao.topicos.map((topico: Topico) => (
                      <span
                        key={topico.id}
                        className="bg-blue-700 text-white text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap shadow-md"
                      >
                        {topico.nome}
                      </span>
                    ))}
                    <div className="ml-3">
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
  );
};

// Componente de Rodapé com Abas
const QuestaoFooter = ({
  questao,
  isAnswered,
  activeTab,
  onToggleTab,
  children
}: {
  questao: Questao;
  isAnswered: boolean;
  activeTab: QuestaoTab;
  onToggleTab: (tab: QuestaoTab) => void;
  children: React.ReactNode;
}) => {
  const getTabIcon = (tab: QuestaoTab) => {
    const isActive = activeTab === tab;
    return isActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="w-full bg-gray-800 rounded-b-lg">
      <div className="w-full rounded-lg overflow-hidden flex flex-col sm:flex-row justify-around items-center py-4">
        {/* Botão Gabarito Comentado */}
        <button
          onClick={() => onToggleTab('gabarito')}
          disabled={!isAnswered}
          className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 transition duration-200 ease-in-out w-full sm:w-1/3 text-center space-x-2 ${activeTab === 'gabarito'
            ? 'text-white bg-blue-900'
            : 'text-gray-300 hover:text-white'
            }`}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-lg">Gabarito comentado</span>
          {getTabIcon('gabarito')}
        </button>

        {/* Botão Estatísticas */}
        <button
          onClick={() => onToggleTab('estatisticas')}
          disabled={!isAnswered}
          className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 transition duration-200 ease-in-out w-full sm:w-1/3 text-center border-t sm:border-t-0 sm:border-l border-gray-700 space-x-2 ${activeTab === 'estatisticas'
            ? 'text-white bg-blue-900'
            : 'text-gray-300 hover:text-white'
            }`}
        >
          <ChartColumn className="w-6 h-6" />
          <span className="text-lg">Estatísticas</span>
          {getTabIcon('estatisticas')}
        </button>

        {/* Botão Dúvida */}
        <button
          onClick={() => onToggleTab('duvida')}
          disabled={!isAnswered}
          className={`font-bold flex flex-row items-center justify-center cursor-pointer p-2 transition duration-200 ease-in-out w-full sm:w-1/3 text-center border-t sm:border-t-0 sm:border-l border-gray-700 space-x-2 ${activeTab === 'duvida'
            ? 'text-white bg-blue-900'
            : 'text-gray-300 hover:text-white'
            }`}
        >
          <HelpCircle className="w-6 h-6" />
          <span className="text-lg">Dúvida</span>
          {getTabIcon('duvida')}
        </button>
      </div>

      {/* Conteúdo das Abas com Animação */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Badge de dificuldade
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

// Renderizador de conteúdo das abas
const renderActiveTabContent = (questao: Questao, activeTab: QuestaoTab, userToken?: string) => {
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
      //token={userToken}
      />
    ),
    estatisticas: (
      <EstatisticasQuestao
        questaoId={questao.id}
        dificuldade={questao.dificuldade}
      />
    )
  };

  return content[activeTab];
};

// Componente Principal
export const ModelQuestions: React.FC<QuestionsPanelProps> = ({
  questions,
  className = ""
}) => {
  const { data: session } = useSession();
  const userToken = session?.laravelToken;

  const {
    selectedAnswers,
    answeredQuestions,
    showFeedback,
    activeTabs,
    openReportModalId,
    topicsVisible,
    handleSelectAnswer,
    handleConfirmAnswer,
    openReportModal,
    closeReportModal,
    toggleTab,
    toggleTopics,
    isQuestionAnswered
  } = useQuestoesState(questions);

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${className} scrollbar-hide`}>
      {/* Container das questões com scroll próprio */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto p-6">
          <main>
            {questions.map((questao, index) => (

              <div
                key={questao.id}
                className="bg-[#00091A] rounded-lg shadow-xl mb-8 border border-[#616161]"
              >
                {/* Cabeçalho da Questão */}
                <QuestaoHeader
                  questao={questao}
                  index={index}
                  topicsVisible={!!topicsVisible[questao.id]}
                  onToggleTopics={() => toggleTopics(questao.id)}
                />

                {/* Metadados */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium my-4 px-6 border-b border-white pb-4">
                  {/* Badges da Prova */}
                  <div className="flex flex-wrap gap-3">
                    {questao.prova?.banca?.nome && (
                      <span className="px-3 py-1 bg-gray-700 rounded-full text-gray-300">
                        {questao.prova.banca.nome}
                      </span>
                    )}
                    {questao.prova?.ano && (
                      <span className="px-3 py-1 bg-gray-700 rounded-full text-gray-300">
                        {questao.prova.ano}
                      </span>
                    )}
                  </div>

                  <OpcoesQuestao
                    questao={questao}
                    onReport={() => openReportModal(questao.id)}
                  />
                </div>

                {/* Corpo da Questão */}
                <section className="p-6 relative">
                  <div
                    className="text-gray-200 mb-6 leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: questao.enunciado }}
                  />

                  {/* Alternativas */}
                  <div className="relative">
                    {questao.alternativas.map((alt) => (
                      <QuizOption
                        key={alt.id}
                        alternativa={alt}
                        questaoId={questao.id}
                        alternativaCorretaId={questao.alternativa_correta_id}
                        selecaoAtual={selectedAnswers[questao.id] || null}
                        statusResposta={isQuestionAnswered(questao.id) ?
                          (selectedAnswers[questao.id] === questao.alternativa_correta_id ? 'correct' : 'incorrect')
                          : 'unanswered'
                        }
                        onSelect={(alternativaId) => handleSelectAnswer(questao.id, alternativaId)}
                      />
                    ))}

                    {/* Overlay de feedback */}
                    {showFeedback[questao.id] && (
                      <AnswerFeedbackOverlay
                        status={selectedAnswers[questao.id] === questao.alternativa_correta_id ? 'correct' : 'incorrect'}
                        onAnimationEnd={() => { }} // ADICIONE ESTA LINHA
                      />
                    )}
                  </div>

                  {/* Botão Responder */}
                  <button
                    onClick={() => handleConfirmAnswer(questao.id, questao.alternativa_correta_id)}
                    disabled={isQuestionAnswered(questao.id) || selectedAnswers[questao.id] == null}
                    className="cursor-pointer mt-8 ml-4 px-8 py-3 bg-[#0E00D0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Responder
                  </button>
                </section>

                {/* Rodapé e Ações */}
                <QuestaoFooter
                  questao={questao}
                  isAnswered={isQuestionAnswered(questao.id)}
                  activeTab={activeTabs[questao.id]}
                  onToggleTab={(tab) => toggleTab(questao.id, tab)}
                >
                  {renderActiveTabContent(questao, activeTabs[questao.id], userToken)}
                </QuestaoFooter>
              </div>


            ))}
          </main>
        </div>
      </div>

      {/* Modal de Reportar */}
      {openReportModalId && (
        <ReportarModal
          questaoId={openReportModalId}
          onClose={closeReportModal}
          token={userToken || ''}
        />
      )}
    </div>
  );
};
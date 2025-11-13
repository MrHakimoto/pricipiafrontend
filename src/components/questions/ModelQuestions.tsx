// components/questions/ModelQuestions.tsx
'use client';

import { useState, useMemo } from "react";
import type { Questao, Alternativa } from '@/types/api';
import { ChartColumn, MessageCircle, HelpCircle, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { AnswerFeedbackOverlay } from '@/components/questions/AnswerFeedbackOverlay';
import { GabaritoQuestao } from "./feedback/gabarito";
import { DuvidaQuestao } from "./feedback/duvida";
import { EstatisticasQuestao } from "./feedback/estatisticas";
import ReportarModal from "@/components/questions/ReportModal";
import OpcoesQuestao from "@/components/questions/OpcoesQuestao";
import { useSession } from "next-auth/react";

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
    optionClass2 = 'flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-500 text-white mr-4 text-xl font-bold bg-blue-900';
  }

  if (isSubmitted) {
    if (isCorrectAnswer) {
      optionClass = 'bg-green-900 border-green-500 cursor-default';
      optionClass2 = 'flex items-center justify-center w-12 h-12 rounded-full border-2 border-green-500 text-white mr-4 text-xl font-bold bg-green-900';
    } else if (isSelected && !isCorrectAnswer) {
      optionClass = 'bg-red-900 border-red-500 cursor-default';
      optionClass2 = 'flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-500 text-white mr-4 text-xl font-bold bg-red-900';
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

type QuestaoTab = 'gabarito' | 'estatisticas' | 'duvida' | null;

interface ModelQuestionsProps {
  questions: Questao[];
  className?: string;
}

export const ModelQuestions: React.FC<ModelQuestionsProps> = ({
  questions,
  className = ""
}) => {
  // Inicializar estados explicitamente para cada questão
  const initialSelectedAnswers = useMemo(() => {
    return questions.reduce((acc, questao) => {
      acc[questao.id] = null;
      return acc;
    }, {} as Record<number, number | null>);
  }, [questions]);

  const initialAnswerStatuses = useMemo(() => {
    return questions.reduce((acc, questao) => {
      acc[questao.id] = 'unanswered';
      return acc;
    }, {} as Record<number, 'unanswered' | 'correct' | 'incorrect'>);
  }, [questions]);

  const [selectedAnswers, setSelectedAnswers] = useState(initialSelectedAnswers);
  const [answerStatuses, setAnswerStatuses] = useState(initialAnswerStatuses);
  const [activeTabs, setActiveTabs] = useState<Record<number, QuestaoTab>>({});
  const [openReportModalId, setOpenReportModalId] = useState<number | null>(null);

  // const [topicsVisible, setTopicsVisible] = useState<Record<number, boolean>>({});
  const [topicsVisible, setTopicsVisible] = useState(false);
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
  const { data: session, status } = useSession();
  const userToken = session?.laravelToken

  const handleSelectAnswer = (questionId: number, alternativaId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: alternativaId,
    }));
  };

  const handleConfirmAnswer = (questionId: number, alternativaCorretaId: number) => {
    const selectedId = selectedAnswers[questionId];
    if (selectedId == null) return;

    const isCorrect = selectedId === alternativaCorretaId;

    // Atualiza status da resposta
    setAnswerStatuses(prev => ({
      ...prev,
      [questionId]: isCorrect ? 'correct' : 'incorrect',
    }));

    // MOSTRA O FEEDBACK
    setShowFeedback(prev => ({
      ...prev,
      [questionId]: true
    }));

    // Remove feedback após 2 segundos
    setTimeout(() => {
      setShowFeedback(prev => ({
        ...prev,
        [questionId]: false
      }));
    }, 2000);
  };

  const openReportModal = (questaoId: number) => {
    setOpenReportModalId(questaoId);
  };

  const closeReportModal = () => {
    setOpenReportModalId(null);
  };

  const toggleTab = (questionId: number, tab: QuestaoTab) => {
    setActiveTabs(prev => ({
      ...prev,
      [questionId]: prev[questionId] === tab ? null : tab
    }));
  };

  const toggleTopics = (questionId: number) => {
    // setTopicsVisible(prev => ({
    //   ...prev,
    //   [questionId]: !prev[questionId]
    // }));

    setTopicsVisible(prev => !prev);

    setShowFeedback(prev => ({
      ...prev,
      [questionId]: true
    }));


    setTimeout(() => {
      setShowFeedback(prev => ({
        ...prev,
        [questionId]: false
      }));
    }, 2000);
  };

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

  return (
    <div className={className}>
      <main>
        {questions.map((questao, index) => (
          <div key={questao.id} className="bg-[#00091A] relative rounded-lg shadow-xl mb-6 border border-[#616161]">
            {/* Cabeçalho */}
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

                  <div className="text-lg font-medium ">
                    <button onClick={() => toggleTopics(questao.id)} className="cursor-pointer text-blue-800 hover:text-blue-600 flex items-center gap-2">
                      {topicsVisible ? <>Ocultar tópicos <ChevronUp className="w-4 h-4" /></> : <>Ver tópicos <ChevronDown className="w-4 h-4" /></>}
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
                            

                            {questao.topicos.map(t => (
                              <span
                                key={t.id}
                                className="bg-blue-700 text-white text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap shadow-md"
                              >
                                {t.nome}
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

            {/* Enunciado */}
            <section className="p-6">
              {questao.enunciado.includes('<') ? (
                <div className="text-gray-200 mb-6 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: questao.enunciado }} />
              ) : (
                <div className="text-gray-200 mb-6 leading-relaxed text-lg">{questao.enunciado}</div>
              )}

              {/* Alternativas */}
              <div className="relative">
                {questao.alternativas.map((alt) => (
                  <QuizOption
                    key={alt.id}
                    alternativa={alt}
                    questaoId={questao.id}
                    alternativaCorretaId={questao.alternativa_correta_id}
                    selecaoAtual={selectedAnswers[questao.id]}
                    statusResposta={answerStatuses[questao.id]}
                    onSelect={(alternativaId) => handleSelectAnswer(questao.id, alternativaId)}
                  />
                ))}

                {showFeedback[questao.id] && (
                  <AnswerFeedbackOverlay status={answerStatuses[questao.id]} />
                )}
              </div>

              {/* botão Responder */}
              <button
                onClick={() => handleConfirmAnswer(questao.id, questao.alternativa_correta_id)}
                disabled={answerStatuses[questao.id] !== 'unanswered' || selectedAnswers[questao.id] === null}
                className=" cursor-pointer mt-8 ml-4 px-8 py-3 bg-[#0E00D0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {answerStatuses[questao.id] !== 'unanswered' ? 'Respondida' : 'Responder'}
              </button>
            </section>

            {/* Rodapé - Abas */}
            <div className="w-full bg-gray-800 rounded-b-lg">
              <div className="flex flex-col sm:flex-row justify-around items-center py-4">
                {[
                  { tab: 'gabarito', icon: MessageCircle, label: 'Gabarito comentado' },
                  { tab: 'estatisticas', icon: ChartColumn, label: 'Estatísticas' },
                  { tab: 'duvida', icon: HelpCircle, label: 'Dúvida' },
                ].map(({ tab, icon: Icon, label }) => (
                  <button
                    key={tab}
                    onClick={() => toggleTab(questao.id, tab as QuestaoTab)}
                    disabled={answerStatuses[questao.id] === 'unanswered'}
                    className={`font-bold flex items-center justify-center w-full sm:w-1/3 py-2 space-x-2 border-t sm:border-t-0 sm:border-l border-gray-700 transition ${activeTabs[questao.id] === tab ? 'text-white bg-blue-900' : 'text-gray-300 hover:text-white'}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-lg">{label}</span>
                    {activeTabs[questao.id] === tab ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              {/* Conteúdo da aba */}
              <AnimatePresence>
                {activeTabs[questao.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden px-6 pb-6"
                  >
                    {activeTabs[questao.id] === 'gabarito' && (
                      (questao.gabarito_video || questao.gabarito_comentado_texto) ? (
                        <GabaritoQuestao
                          questaoId={questao.id}
                          gabaritoVideo={questao.gabarito_video}
                          gabaritoComentado={questao.gabarito_comentado_texto}
                        />
                      ) : (
                        <p className="text-gray-400 italic">Nenhum gabarito disponível.</p>
                      )
                    )}

                    {activeTabs[questao.id] === 'estatisticas' && (
                      <EstatisticasQuestao questaoId={questao.id} dificuldade={questao.dificuldade} />
                    )}

                    {activeTabs[questao.id] === 'duvida' && (
                      <DuvidaQuestao questaoId={questao.id} enunciado={questao.enunciado} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        ))}
      </main>
      {openReportModalId && (
        <ReportarModal
          questaoId={openReportModalId}
          onClose={closeReportModal}
          token={userToken}
        />
      )}
    </div>
  );
};

export default ModelQuestions;
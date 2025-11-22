// contexts/NavigationContext.tsx - VERSÃO ATUALIZADA
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { QuestaoBase } from '@/types/questions';

export type NavigationQuestion = QuestaoBase;
export type QuestionStatus = 'unanswered' | 'correct' | 'incorrect' | 'viewing' | 'answered';

export interface QuestaoNavigation {
  id: number;
  status: QuestionStatus;
  numero: number;
  isHovered?: boolean;
  isViewing?: boolean;
}

export interface NavigationContextType {
  questions: QuestaoNavigation[];
  currentQuestionId: number | null;
  updateQuestionStatus: (questionId: number, status: 'correct' | 'incorrect' | 'answered') => void;
  setCurrentQuestion: (questionId: number) => void;
  setQuestionHover: (questionId: number, isHovered: boolean) => void;
  scrollToQuestion: (questionId: number) => void;
  
  // ✅ NOVOS: Para o botão "refazer lista"
  todasQuestoesRespondidas: boolean;
  progresso: {
    respondidas: number;
    total: number;
    percentual: number;
  };
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  questions: NavigationQuestion[];
  respostasSalvas?: Record<number, number>;
  isSimuladoOuProva?: boolean;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  questions: initialQuestions,
  respostasSalvas,
  isSimuladoOuProva = false
}) => {
  const [questionsNavigation, setQuestionsNavigation] = useState<QuestaoNavigation[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  
  const initializedRef = useRef(false);

  // ✅ CALCULAR PROGRESSO (usando useMemo para performance)
  const progresso = useMemo(() => {
    const respondidas = questionsNavigation.filter(q => 
      q.status === 'correct' || q.status === 'incorrect' || q.status === 'answered'
    ).length;
    const total = questionsNavigation.length;
    
    return {
      respondidas,
      total,
      percentual: total > 0 ? Math.round((respondidas / total) * 100) : 0
    };
  }, [questionsNavigation]);

  // ✅ VERIFICAR SE TODAS AS QUESTÕES FORAM RESPONDIDAS
  const todasQuestoesRespondidas = useMemo(() => {
    return progresso.respondidas > 0 && progresso.respondidas >= progresso.total;
  }, [progresso]);

  // ✅ FUNÇÃO CORRIGIDA: Agora considera isSimuladoOuProva corretamente
  const getQuestionStatus = useCallback((questaoId: number, questaoData: NavigationQuestion, respostas: Record<number, number>): QuestionStatus => {
    if (respostas[questaoId]) {
      // ✅ SE for simulado/prova, SEMPRE retorna 'answered' (nunca correct/incorrect)
      if (isSimuladoOuProva) {
        return 'answered';
      } else {
        // ✅ SE for lista normal, mostra correct/incorrect
        const respostaId = respostas[questaoId];
        const isCorrect = respostaId === questaoData.alternativa_correta_id;
        return isCorrect ? 'correct' : 'incorrect';
      }
    }
    return 'unanswered';
  }, [isSimuladoOuProva]);

  useEffect(() => {
    if (initialQuestions.length === 0) return;

    console.log('🔄 NavigationProvider: Inicializando', {
      questionsCount: initialQuestions.length,
      respostasCount: respostasSalvas ? Object.keys(respostasSalvas).length : 0,
      isSimuladoOuProva,
      primeiraVez: !initializedRef.current
    });

    const initialNavigation: QuestaoNavigation[] = initialQuestions.map((questao, index) => {
      const status = respostasSalvas 
        ? getQuestionStatus(questao.id, questao, respostasSalvas)
        : 'unanswered';

      console.log(`📝 Questão ${questao.id} - Status: ${status} (isSimuladoOuProva: ${isSimuladoOuProva})`);

      return {
        id: questao.id,
        status,
        numero: index + 1,
        isHovered: false,
        isViewing: index === 0 && !initializedRef.current
      };
    });
    
    setQuestionsNavigation(initialNavigation);

    if (initialQuestions.length > 0 && !initializedRef.current) {
      setCurrentQuestionId(initialQuestions[0].id);
    }

    initializedRef.current = true;

  }, [initialQuestions, respostasSalvas, getQuestionStatus]);

  const updateQuestionStatus = useCallback((questionId: number, status: 'correct' | 'incorrect' | 'answered') => {
    console.log(`🔄 Atualizando questão ${questionId} para: ${status} (isSimuladoOuProva: ${isSimuladoOuProva})`);
    
    // ✅ CORREÇÃO: Para simulados/provas, força o status 'answered' se tentarem usar correct/incorrect
    let finalStatus = status;
    if (isSimuladoOuProva && (status === 'correct' || status === 'incorrect')) {
      finalStatus = 'answered';
      console.log(`🎯 Simulado/Prova: Convertendo ${status} para 'answered'`);
    }
    
    setQuestionsNavigation(prev => 
      prev.map(q => 
        q.id === questionId ? { ...q, status: finalStatus } : q
      )
    );
  }, [isSimuladoOuProva]);

  const setCurrentQuestion = useCallback((questionId: number) => {
    setCurrentQuestionId(questionId);
    setQuestionsNavigation(prev =>
      prev.map(q => ({ 
        ...q, 
        isViewing: q.id === questionId 
      }))
    );
  }, []);

  const setQuestionHover = useCallback((questionId: number, isHovered: boolean) => {
    setQuestionsNavigation(prev =>
      prev.map(q => 
        q.id === questionId ? { ...q, isHovered } : q
      )
    );
  }, []);

  const scrollToQuestion = useCallback((questionId: number) => {
    setTimeout(() => {
      const element = document.getElementById(`question-${questionId}`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center', 
          inline: 'nearest' 
        });
        setCurrentQuestion(questionId);
      }
    }, 100);
  }, [setCurrentQuestion]);

  const value: NavigationContextType = {
    questions: questionsNavigation,
    currentQuestionId,
    updateQuestionStatus,
    setCurrentQuestion,
    setQuestionHover,
    scrollToQuestion,
    // ✅ NOVOS VALORES
    todasQuestoesRespondidas,
    progresso,
  };

  // Log para debug
  useEffect(() => {
    console.log('📊 NavigationContext Estado:', {
      isSimuladoOuProva,
      questionsCount: questionsNavigation.length,
      correctCount: questionsNavigation.filter(q => q.status === 'correct').length,
      incorrectCount: questionsNavigation.filter(q => q.status === 'incorrect').length,
      answeredCount: questionsNavigation.filter(q => q.status === 'answered').length,
      unansweredCount: questionsNavigation.filter(q => q.status === 'unanswered').length,
      todasQuestoesRespondidas,
      progresso: `${progresso.respondidas}/${progresso.total} (${progresso.percentual}%)`
    });
  }, [questionsNavigation, isSimuladoOuProva, todasQuestoesRespondidas, progresso]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
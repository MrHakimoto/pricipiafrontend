// contexts/NavigationContext.tsx (corrigido)
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Questao } from '@/types/api';

export type QuestionStatus = 'unanswered' | 'correct' | 'incorrect' | 'viewing';

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
  updateQuestionStatus: (questionId: number, status: 'correct' | 'incorrect') => void;
  setCurrentQuestion: (questionId: number) => void;
  setQuestionHover: (questionId: number, isHovered: boolean) => void;
  scrollToQuestion: (questionId: number) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  questions: Questao[];
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  questions: initialQuestions 
}) => {
  const [questionsNavigation, setQuestionsNavigation] = useState<QuestaoNavigation[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  useEffect(() => {
    const initialNavigation: QuestaoNavigation[] = initialQuestions.map((questao, index) => ({
      id: questao.id,
      status: 'unanswered',
      numero: index + 1,
      isHovered: false,
      isViewing: index === 0 // Primeira questão como viewing por padrão
    }));
    setQuestionsNavigation(initialNavigation);
    
    if (initialQuestions.length > 0) {
      setCurrentQuestionId(initialQuestions[0].id);
    }
  }, [initialQuestions]);

  const updateQuestionStatus = (questionId: number, status: 'correct' | 'incorrect') => {
    setQuestionsNavigation(prev => 
      prev.map(q => 
        q.id === questionId ? { ...q, status } : q
      )
    );
  };

  const setCurrentQuestion = (questionId: number) => {
    const previousQuestionId = currentQuestionId;
    setCurrentQuestionId(questionId);

    // Atualiza o estado de visualização sem afetar o status de correção
    setQuestionsNavigation(prev =>
      prev.map(q => ({
        ...q,
        isViewing: q.id === questionId, // Apenas a questão atual fica como viewing
        status: q.status // Mantém o status original (correct/incorrect/unanswered)
      }))
    );
  };

  const setQuestionHover = (questionId: number, isHovered: boolean) => {
    setQuestionsNavigation(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, isHovered } : q
      )
    );
  };

  const scrollToQuestion = (questionId: number) => {
    console.log('Scroll to question:', questionId);
    
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      // Scroll mais preciso para o centro da tela
       element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });

    } else {
      console.error('Element not found:', `question-${questionId}`);
    }
  };

  const value: NavigationContextType = {
    questions: questionsNavigation,
    currentQuestionId,
    updateQuestionStatus,
    setCurrentQuestion,
    setQuestionHover,
    scrollToQuestion
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
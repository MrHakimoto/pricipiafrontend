// contexts/NavigationContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { QuestaoBase } from '@/types/questions';

// Tipo que o NavigationProvider vai receber (mesmo do questionsFormatted)
export type NavigationQuestion = QuestaoBase;

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
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  questions: NavigationQuestion[];
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  questions: initialQuestions 
}) => {
  const [questionsNavigation, setQuestionsNavigation] = useState<QuestaoNavigation[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  // Inicializar questões de navegação
  useEffect(() => {
    console.log('Inicializando NavigationProvider com questões:', initialQuestions.length);
    
    const initialNavigation: QuestaoNavigation[] = initialQuestions.map((questao, index) => ({
      id: questao.id,
      status: 'unanswered',
      numero: index + 1,
      isHovered: false,
      isViewing: index === 0 // Primeira questão como viewing inicial
    }));
    
    setQuestionsNavigation(initialNavigation);

    if (initialQuestions.length > 0) {
      const firstQuestionId = initialQuestions[0].id;
      setCurrentQuestionId(firstQuestionId);
      console.log('Questão inicial definida:', firstQuestionId);
    }
  }, [initialQuestions]);

  const updateQuestionStatus = useCallback((questionId: number, status: 'correct' | 'incorrect') => {
    console.log(`Atualizando status da questão ${questionId} para:`, status);
    setQuestionsNavigation(prev => 
      prev.map(q => 
        q.id === questionId ? { ...q, status } : q
      )
    );
  }, []);

  const setCurrentQuestion = useCallback((questionId: number) => {
    console.log('Definindo questão atual:', questionId);
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
    console.log('Scroll para questão:', questionId);
    
    // Pequeno delay para garantir que o DOM esteja atualizado
    setTimeout(() => {
      const element = document.getElementById(`question-${questionId}`);
      if (element) {
        console.log('Elemento encontrado, fazendo scroll...');
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center', 
          inline: 'nearest' 
        });
        
        // Atualizar a questão atual após o scroll
        setCurrentQuestion(questionId);
      } else {
        console.warn(`Elemento question-${questionId} não encontrado para scroll`);
        
        // Tentar encontrar qualquer elemento com data-question-id como fallback
        const fallbackElement = document.querySelector(`[data-question-id="${questionId}"]`);
        if (fallbackElement) {
          console.log('Elemento fallback encontrado, fazendo scroll...');
          fallbackElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center', 
            inline: 'nearest' 
          });
          setCurrentQuestion(questionId);
        }
      }
    }, 100);
  }, [setCurrentQuestion]);

  const value: NavigationContextType = {
    questions: questionsNavigation,
    currentQuestionId,
    updateQuestionStatus,
    setCurrentQuestion,
    setQuestionHover,
    scrollToQuestion
  };

  // Log para debug
  useEffect(() => {
    console.log('Estado atual do NavigationContext:', {
      currentQuestionId,
      questionsCount: questionsNavigation.length,
      viewingQuestions: questionsNavigation.filter(q => q.isViewing).length,
      correctCount: questionsNavigation.filter(q => q.status === 'correct').length,
      incorrectCount: questionsNavigation.filter(q => q.status === 'incorrect').length
    });
  }, [currentQuestionId, questionsNavigation]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
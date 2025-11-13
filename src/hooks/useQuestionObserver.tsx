// hooks/useQuestionObserver.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';

export const useQuestionObserver = (questionId: number) => {
  const questionRef = useRef<HTMLDivElement>(null);
  const { setCurrentQuestion } = useNavigation();

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log('Questão visível:', questionId, 'ratio:', entry.intersectionRatio);
        setCurrentQuestion(questionId);
      }
    });
  }, [questionId, setCurrentQuestion]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      handleIntersection,
      {
        threshold: [0.1, 0.3, 0.5, 0.7, 0.9], // Múltiplos thresholds para melhor detecção
        rootMargin: '-100px 0px -100px 0px' // Margem ajustada
      }
    );

    const currentRef = questionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
      console.log(`Observando questão ${questionId}`);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
        console.log(`Parando de observar questão ${questionId}`);
      }
    };
  }, [questionId, handleIntersection]);

  return questionRef;
};
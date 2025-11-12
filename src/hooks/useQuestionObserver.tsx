// hooks/useQuestionObserver.ts (atualizado)
'use client';

import { useEffect, useRef } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';

export const useQuestionObserver = (questionId: number) => {
  const questionRef = useRef<HTMLDivElement>(null);
  const { setCurrentQuestion } = useNavigation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            console.log('Questão visível:', questionId, 'ratio:', entry.intersectionRatio);
            setCurrentQuestion(questionId);
          }
        });
      },
      {
        threshold: [0.2, 0.4, 0.6, 0.8],
        rootMargin: '-20% 0px -20% 0px'
      }
    );

    const currentRef = questionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [questionId, setCurrentQuestion]);

  return questionRef;
};
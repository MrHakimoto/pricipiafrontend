// components/questions/QuestionWrapper.tsx
'use client';

import { useQuestionObserver } from '@/hooks/useQuestionObserver';
import React from 'react';

interface QuestionWrapperProps {
  questionId: number;
  children: React.ReactNode;
  className?: string;
}

export const QuestionWrapper: React.FC<QuestionWrapperProps> = ({ 
  questionId, 
  children,
  className = '' 
}) => {
  const questionRef = useQuestionObserver(questionId);

  return (
    <div 
      id={`question-${questionId}`} 
      ref={questionRef}
      className={`question-section scroll-mt-4 ${className}`}
      data-question-id={questionId}
    >
      {children}
    </div>
  );
};

// Exportação nomeada correta
export default QuestionWrapper;
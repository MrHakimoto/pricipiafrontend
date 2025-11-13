'use client';

import { useQuestionObserver } from '@/hooks/useQuestionObserver';
import React, { useRef, useEffect } from 'react';

interface QuestionWrapperProps {
  questionId: number;
  children: React.ReactNode;
}

export const QuestionWrapper: React.FC<QuestionWrapperProps> = ({ 
  questionId, 
  children 
}) => {
  const questionRef = useQuestionObserver(questionId);

  return (
    <div id={`question-${questionId}`} ref={questionRef} className="question-section">
      {children}
    </div>
  );
};

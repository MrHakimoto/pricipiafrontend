// components/questions/QuestionWrapper.tsx
'use client';

import { useQuestionObserver } from '@/hooks/useQuestionObserver';

interface QuestionWrapperProps {
  questionId: number;
  children: (questionRef: React.RefObject<HTMLDivElement>) => React.ReactNode;
}

export const QuestionWrapper: React.FC<QuestionWrapperProps> = ({ 
  questionId, 
  children 
}) => {
  const questionRef = useQuestionObserver(questionId);

  return (
    <div id={`question-${questionId}`} className="question-section">
      {children(questionRef)}
    </div>
  );
};
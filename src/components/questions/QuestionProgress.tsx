// components/questions/QuestionProgress.tsx
'use client';

import { useNavigation } from '@/contexts/NavigationContext';

interface QuestionProgressProps {
  className?: string;
}

export const QuestionProgress: React.FC<QuestionProgressProps> = ({ 
  className = "" 
}) => {
  const { questions } = useNavigation();
  
  const answeredCount = questions.filter(q => 
    q.status === 'correct' || q.status === 'incorrect'
  ).length;
  
  const correctCount = questions.filter(q => q.status === 'correct').length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className={`bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700 ${className}`}>
      <div className="flex justify-between text-white text-sm mb-2">
        <span>Progresso: {answeredCount}/{questions.length}</span>
        <span>Acertos: {correctCount}/{answeredCount}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {answeredCount > 0 && (
        <div className="mt-2 text-center">
          <span className="text-sm text-gray-300">
            Taxa de acertos: {Math.round((correctCount / answeredCount) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};
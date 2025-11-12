'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionNavigationSidebarProps {
  className?: string;
}

export const QuestionNavigationSidebar: React.FC<QuestionNavigationSidebarProps> = ({ className = '' }) => {
  const { questions, currentQuestionId } = useNavigation();

  const scrollToQuestion = (questionId: number) => {
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct':
        return 'bg-green-500 border-green-400';
      case 'incorrect':
        return 'bg-red-500 border-red-400';
      case 'current':
        return 'bg-blue-500 border-blue-400 border-2';
      default:
        return 'bg-gray-600 border-gray-500 hover:bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct':
        return '✓';
      case 'incorrect':
        return '✕';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-[#00091A] border-l border-gray-700 w-20 flex flex-col items-center py-4 space-y-3 overflow-y-auto ${className}`}>
      <AnimatePresence>
        {questions.map((question) => (
          <motion.button
            key={question.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToQuestion(question.id)}
            className={`
              relative w-12 h-12 rounded-lg border-2 transition-all duration-200
              flex items-center justify-center text-white font-bold text-sm
              ${getStatusColor(question.status)}
              ${currentQuestionId === question.id ? 'ring-2 ring-white ring-opacity-50' : ''}
            `}
          >
            {question.numero}
            
            {/* Badge de status */}
            {(question.status === 'correct' || question.status === 'incorrect') && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center text-xs"
              >
                <span className={question.status === 'correct' ? 'text-green-600' : 'text-red-600'}>
                  {getStatusIcon(question.status)}
                </span>
              </motion.span>
            )}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
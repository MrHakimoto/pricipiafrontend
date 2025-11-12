// components/questions/ModelQuestionsWithNavigation.tsx
'use client';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { QuestionNavigationSidebar } from '@/components/questions/QuestionNavigationSidebar';
import { QuestionProgress } from '@/components/questions/QuestionProgress';
import { ModelQuestions } from '@/components/questions/ModelQuestions';
import type { Questao } from '@/types/api';

interface ModelQuestionsWithNavigationProps {
  questions: Questao[];
  showSidebar?: boolean;
  showProgress?: boolean;
}

export const ModelQuestionsWithNavigation: React.FC<ModelQuestionsWithNavigationProps> = ({
  questions,
  showSidebar = true,
  showProgress = true
}) => {
  return (
    <NavigationProvider questions={questions}>
      <div className="flex h-screen bg-gray-900">
        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {showProgress && <QuestionProgress />}
            <ModelQuestions questions={questions} />
          </div>
        </div>
        
        {/* Barra lateral de navegação */}
        {showSidebar && <QuestionNavigationSidebar />}
      </div>
    </NavigationProvider>
  );
};
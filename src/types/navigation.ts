// types/navigation.ts
export interface QuestaoNavigation {
  id: number;
  status: 'unanswered' | 'correct' | 'incorrect' | 'current';
  numero: number;
}

export interface NavigationContextType {
  questions: QuestaoNavigation[];
  currentQuestionId: number | null;
  updateQuestionStatus: (questionId: number, status: 'unanswered' | 'correct' | 'incorrect') => void;
  setCurrentQuestion: (questionId: number) => void;
}
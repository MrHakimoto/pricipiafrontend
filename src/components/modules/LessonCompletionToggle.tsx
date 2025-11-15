// components/modules/LessonCompletionToggle.tsx
"use client";
import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { markLessonCompleted, markLessonUncompleted } from '@/lib/course/lessonProgress';
import { useSession } from 'next-auth/react';

interface LessonCompletionToggleProps {
  lessonId: number;
  isCompleted: boolean;
  onCompletionChange: (lessonId: number, completed: boolean) => void;
  size?: number;
}

export default function LessonCompletionToggle({
  lessonId,
  isCompleted,
  onCompletionChange,
  size = 28
}: LessonCompletionToggleProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(isCompleted);

  // Sincroniza com prop changes
  useEffect(() => {
    setIsChecked(isCompleted);
  }, [isCompleted]);

  const handleToggle = async () => {
    if (!session?.laravelToken || isLoading) return;

    setIsLoading(true);
    const newCompletedState = !isChecked;
    
    try {
      if (newCompletedState) {
        await markLessonCompleted(lessonId, session.laravelToken);
      } else {
        await markLessonUncompleted(lessonId, session.laravelToken);
      }
      
      setIsChecked(newCompletedState);
      onCompletionChange(lessonId, newCompletedState);
      
      // Auto-save no localStorage
      const completionKey = `lesson-${lessonId}-completed`;
      localStorage.setItem(completionKey, newCompletedState.toString());
      
    } catch (error: any) {
      console.error('Erro ao alterar estado da aula:', error);
      // Revert on error
      setIsChecked(isCompleted);
    } finally {
      setIsLoading(false);
    }
  };

  // Check localStorage on mount for instant feedback
  useEffect(() => {
    const completionKey = `lesson-${lessonId}-completed`;
    const savedState = localStorage.getItem(completionKey);
    if (savedState) {
      const savedCompleted = savedState === 'true';
      if (savedCompleted !== isCompleted) {
        setIsChecked(savedCompleted);
        onCompletionChange(lessonId, savedCompleted);
      }
    }
  }, [lessonId]);

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        relative flex items-center justify-center 
        rounded-lg border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isChecked 
          ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600' 
          : 'bg-transparent border-gray-400 hover:border-gray-300 hover:bg-gray-700/50'
        }
      `}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isLoading ? 0.9 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      <AnimatePresence mode="wait">
        {isChecked && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 15
            }}
          >
            <CheckCircle 
              size={size * 0.7} 
              className="text-white" 
              strokeWidth={2.5}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-transparent border-t-blue-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.button>
  );
}
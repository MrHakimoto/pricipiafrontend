// components/modules/LessonCompletionToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  markLessonCompleted,
  markLessonUncompleted,
} from "@/lib/course/lessonProgress";
import { useSession } from "next-auth/react";

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
  size = 28,
}: LessonCompletionToggleProps) {
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(Boolean(isCompleted));

  useEffect(() => {
    setIsChecked(Boolean(isCompleted));
  }, [isCompleted]);

  const handleToggle = async () => {
    if (!session?.laravelToken || isLoading) return;

    const previousState = isChecked;
    const nextState = !previousState;

    setIsLoading(true);
    setIsChecked(nextState);

    try {
      if (nextState) {
        await markLessonCompleted(lessonId, session.laravelToken);
      } else {
        await markLessonUncompleted(lessonId, session.laravelToken);
      }

      onCompletionChange(lessonId, nextState);
    } catch (error: any) {
      console.error(
        "Erro ao alterar estado da aula:",
        error.response?.data || error.message || error,
      );

      setIsChecked(previousState);
      onCompletionChange(lessonId, previousState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      disabled={isLoading || !session?.laravelToken}
      aria-pressed={isChecked}
      title={isChecked ? "Marcar como não concluída" : "Marcar como concluída"}
      className={`
        relative flex items-center justify-center
        rounded-lg border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          isChecked
            ? "border-green-500 bg-green-500 hover:border-green-600 hover:bg-green-600"
            : "border-gray-400 bg-transparent hover:border-gray-300 hover:bg-gray-700/50"
        }
      `}
      style={{ width: size, height: size }}
      whileHover={{ scale: isLoading ? 1 : 1.05 }}
      whileTap={{ scale: isLoading ? 1 : 0.95 }}
      animate={{
        scale: isLoading ? 0.9 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      <AnimatePresence mode="wait">
        {isChecked && (
          <motion.div
            key="checked"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 15,
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
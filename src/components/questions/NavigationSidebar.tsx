// components/questions/NavigationSidebar.tsx
'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Clock, Mail, XCircle, Square } from "lucide-react";
import Link from "next/link";

interface NavigationSidebarProps {
  className?: string;
  listaInfo?: {
    id: number;
    nome: string;
    descricao?: string;
    total_time_in_seconds?: number;
  };
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
  className = "",
  listaInfo
}) => {
  const { questions, scrollToQuestion, setQuestionHover } = useNavigation();

  // Estatísticas
  const correctCount = questions.filter(q => q.status === 'correct').length;
  const incorrectCount = questions.filter(q => q.status === 'incorrect').length;
  const viewingCount = questions.filter(q => q.isViewing).length;
  const unansweredCount = questions.filter(q => q.status === 'unanswered').length;
  
  const totalTime = listaInfo?.total_time_in_seconds || questions.length * 3;
  const difficulty = "Médio";

  const getStatusClasses = (question: any) => {
    const baseClasses = "px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300 border-2 ";
    
    // PRIORIDADE: viewing > correct/incorrect > hover > unanswered
    
    // Primeiro verifica se está sendo visualizada (MAIOR PRIORIDADE)
    if (question.isViewing) {
      if (question.status === 'correct') {
        return baseClasses + (question.isHovered 
          ? 'bg-green-800 text-green-300 border-white shadow-lg scale-110' 
          : 'bg-green-900 text-green-400 border-blue-500 shadow-lg shadow-blue-500/50');
      }
      if (question.status === 'incorrect') {
        return baseClasses + (question.isHovered 
          ? 'bg-red-800 text-red-300 border-white shadow-lg scale-110' 
          : 'bg-red-900 text-red-400 border-blue-500 shadow-lg shadow-blue-500/50');
      }
      return baseClasses + (question.isHovered 
        ? 'bg-blue-800 text-blue-300 border-white shadow-lg scale-110' 
        : 'bg-blue-900 text-blue-400 border-blue-500 shadow-lg shadow-blue-500/50');
    }
    
    // Depois verifica o status de correção
    if (question.status === 'correct') {
      return baseClasses + (question.isHovered 
        ? 'bg-green-800 text-green-300 border-white shadow-lg scale-110' 
        : 'bg-green-900 text-green-400 border-green-600 shadow-lg shadow-green-500/25');
    }
    if (question.status === 'incorrect') {
      return baseClasses + (question.isHovered 
        ? 'bg-red-800 text-red-300 border-white shadow-lg scale-110' 
        : 'bg-red-900 text-red-400 border-red-600 shadow-lg shadow-red-500/25');
    }
    
    // Por último verifica hover e estado normal
    if (question.isHovered) {
      return baseClasses + 'bg-gray-700 text-white border-white shadow-lg scale-110';
    }
    
    return baseClasses + 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700';
  };

  const handleMouseEnter = (questionId: number) => {
    setQuestionHover(questionId, true);
  };

  const handleMouseLeave = (questionId: number) => {
    setQuestionHover(questionId, false);
  };

  const handleQuestionClick = (questionId: number) => {
    console.log('Clicou na questão:', questionId);
    scrollToQuestion(questionId);
  };

  return (
    <div className={` bg-[#00091A] border-r border-gray-800 flex flex-col ${className}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 p-5 overflow-y-auto"
      >
        {/* Voltar */}
        <Link 
          href="/listas-oficiais" 
          className="text-gray-400 text-sm hover:text-white flex items-center gap-1 mb-6 transition-colors duration-200"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FileText className="text-blue-500" size={16} />
            <span>Minhas Listas</span>
          </div>

          <h2 className="text-lg font-semibold text-white">
            {listaInfo?.nome || "Minha lista fofinha :)"}dsf
            
          </h2>

          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <div className="flex items-center gap-1">
              <Clock size={14} /> <span>≈ {totalTime} min</span>
            </div>
            <span className="bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">{difficulty}</span>
          </div>
        </div>

        {/* Tag */}
        <div className="mb-4">
          <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-lg">
            Geometria
          </span>
        </div>

        {/* Estatísticas */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <div className="flex items-center gap-1 text-green-400">
            <Mail size={14} /> {correctCount}
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <XCircle size={14} /> {incorrectCount}
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Square size={14} /> {unansweredCount}
          </div>
        </div>

        {/* Barras de progresso */}
        <div className="flex gap-1 mb-4">
          <div 
            className="h-2 rounded-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${(correctCount / questions.length) * 100}%` }}
          ></div>
          <div 
            className="h-2 rounded-full bg-red-500 transition-all duration-500 ease-out"
            style={{ width: `${(incorrectCount / questions.length) * 100}%` }}
          ></div>
          <div 
            className="h-2 rounded-full bg-gray-600 transition-all duration-500 ease-out"
            style={{ width: `${(unansweredCount / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Números das Questões */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {questions.map((question) => (
            <motion.button
              key={question.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => handleMouseEnter(question.id)}
              onMouseLeave={() => handleMouseLeave(question.id)}
              onClick={() => handleQuestionClick(question.id)}
              className={getStatusClasses(question)}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
            >
              {question.numero}
            </motion.button>
          ))}
        </div>

        {/* Botão PDF */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-pink-600 hover:bg-pink-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-all duration-300"
        >
          Gerar PDF da lista <span className="bg-white text-pink-600 px-2 py-1 rounded-md text-xs font-bold">PDF</span>
        </motion.button>
      </motion.div>
    </div>
  );
};
// components/questions/OpcoesQuestao.tsx - COM ANIMAÇÃO
'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Copy, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Questao } from '@/types/list'; // CORREÇÃO: Importar de '@/types/list'
import { useSession } from 'next-auth/react';

interface OpcoesQuestaoProps {
  questao: {
    id: number;
    enunciado: string;
    // apenas as propriedades que você realmente usa
  };
  onReport: () => void;
}




export default function OpcoesQuestao({ questao, onReport }: OpcoesQuestaoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //   const handleCopyText = async () => {
  //     try {
  //       await navigator.clipboard.writeText(questao.enunciado);
  //       setIsOpen(false);
  //       console.log('Texto copiado!');
  //     } catch (err) {
  //       console.error('Falha ao copiar texto:', err);
  //     }
  //   };

  const handleReport = () => {
    setIsOpen(false);
    onReport();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de abrir */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 cursor-pointer rounded-lg transition duration-200 ${
          isOpen ? 'bg-gray-700' : 'hover:bg-gray-700'
        }`}
      >
        <MoreVertical className="w-5 h-5 text-gray-300" />
      </button>

      {/* Dropdown Menu com Animação */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 py-1"
          >
            {/* <motion.button
              whileHover={{ backgroundColor: 'rgba(55, 65, 81, 1)' }}
              onClick={handleCopyText}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-300 transition duration-150"
            >
              <Copy className="w-4 h-4 mr-3" />
              Copiar texto fonte
            </motion.button> */}
            
            <motion.button
              whileHover={{ backgroundColor: 'rgba(55, 65, 81, 1)' }}
              onClick={handleReport}
              className="flex cursor-pointer items-center w-full px-4 py-3 text-sm text-gray-300 transition duration-150"
            >
              <AlertTriangle className="w-4 h-4 mr-3" />
              Reportar problema
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
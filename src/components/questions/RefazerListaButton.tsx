// components/questions/RefazerListaButton.tsx - ATUALIZADO
'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCcw, CheckCircle, Trophy } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';

interface RefazerListaButtonProps {
  onRefazerLista: () => Promise<void>;
  isLoading?: boolean;
  isTentativaFinalizada?: boolean;
}

export const RefazerListaButton: React.FC<RefazerListaButtonProps> = ({
  onRefazerLista,
  isLoading = false,
  isTentativaFinalizada = false
}) => {
  const { progresso } = useNavigation();

  const handleClick = async () => {
    if (!isLoading) {
      await onRefazerLista();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 50 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
        >
          {/* Botão Principal */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            disabled={isLoading}
            className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-2xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-bold text-lg flex items-center gap-3 border-2 border-green-400 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Iniciando...</span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.div>
                <span>Refazer Lista</span>
              </>
            )}
          </motion.button>

          {/* Indicador de Status */}
          <div className={`bg-black/90 text-white px-4 py-2 rounded-lg border shadow-2xl mt-3 ${
            isTentativaFinalizada ? 'border-yellow-500 bg-yellow-900/20' : 'border-green-500 bg-green-900/20'
          }`}>
            <div className="text-sm font-semibold text-center flex items-center justify-center gap-2">
              {isTentativaFinalizada ? (
                <>
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300">Lista Concluída!</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-300">Todas Respondidas!</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-300 text-center mt-1">
              {progresso.respondidas}/{progresso.total} questões
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              {isTentativaFinalizada ? 'Clique para tentar novamente' : 'Finalize para ver seu resultado'}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
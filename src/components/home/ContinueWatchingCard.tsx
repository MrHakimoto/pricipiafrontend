// src/components/home/ContinueWatchingCard.tsx
'use client';

import { useContinueWatching, type ContinueWatchingData } from './ContinueWatching';
import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';

interface ContinueWatchingCardProps {
  data?: ContinueWatchingData | null;
}

export default function ContinueWatchingCard({ data }: ContinueWatchingCardProps) {
  const { data: hookData, loading, error } = useContinueWatching();
  
  // Usa os dados passados por prop ou do hook
  const continueData = data || hookData;

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !continueData) {
    return null; // Não mostra nada se não houver dados
  }

  const { aula, progress_percentage, last_watched_timestamp } = continueData;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
      onClick={() => {
        // Navegar para a aula ou reproduzir vídeo
        console.log('Continuar aula:', aula.id);
      }}
    >
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Play size={20} className="text-blue-400" />
        Continuar Assistindo
      </h2>
      
      <div className="space-y-3">
        <div>
          <h3 className="text-white font-medium text-lg">{aula.title}</h3>
          <p className="text-gray-400 text-sm">{aula.module.name}</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={16} />
          <span>Continuar de {formatTime(last_watched_timestamp)}</span>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress_percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-400">
          <span>{progress_percentage}% concluído</span>
          <span>{formatTime(last_watched_timestamp)} / {formatTime(aula.duration)}</span>
        </div>
      </div>
    </motion.div>
  );
}
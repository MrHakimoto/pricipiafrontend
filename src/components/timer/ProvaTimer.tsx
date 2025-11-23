// components/timer/ProvaTimer.tsx
"use client";

import { useTimer } from '@/hooks/useTimer';
import { Eye, EyeOff, Clock } from 'lucide-react';

interface ProvaTimerProps {
  startedAt: string;
  tempoEscolhido: number;
  isCompleted: boolean;
}

export function ProvaTimer({ startedAt, tempoEscolhido, isCompleted }: ProvaTimerProps) {
  const { 
    tempoFormatado, 
    tempoExcedido, 
    tempoDecorrido, 
    isTimerVisible, 
    toggleTimer 
  } = useTimer({
    startedAt,
    tempoEscolhido,
    isCompleted,
  });

  if (!startedAt) {
    return null;
  }

  // Se o timer está oculto, mostra apenas um botão pequeno para mostrar
  if (!isTimerVisible) {
    return (
      <div className="flex items-center justify-center p-2 bg-[#00091A] border-b border-gray-800">
        <button
          onClick={toggleTimer}
          className="flex items-center gap-2 px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded-lg border border-gray-600 hover:border-gray-400"
          title="Mostrar timer"
        >
          <Eye size={14} />
          <span>Mostrar Timer</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-[#00091A] border-b border-gray-800">
      {/* Timer Principal */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
          tempoExcedido 
            ? 'bg-red-900/20 border border-red-500/50' 
            : 'bg-blue-900/20 border border-blue-500/50'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              tempoExcedido ? 'bg-red-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-medium text-gray-300">
              {tempoExcedido ? 'Tempo Excedido' : 'Tempo Restante'}
            </span>
          </div>
          
          <div className={`text-xl font-mono font-bold ${
            tempoExcedido ? 'text-red-400' : 'text-white'
          }`}>
            {tempoFormatado}
          </div>

          {!isCompleted && (
            <div className="text-xs text-gray-400 ml-2">
              ({Math.floor(tempoDecorrido / 60)}min decorridos)
            </div>
          )}
        </div>

        {/* Informação do tempo total */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={16} />
          <span>Tempo total: {tempoEscolhido}min</span>
        </div>
      </div>

      {/* Botão para ocultar */}
      <button
        onClick={toggleTimer}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
        title="Ocultar timer"
      >
        <EyeOff size={16} />
        <span>Ocultar</span>
      </button>
    </div>
  );
}
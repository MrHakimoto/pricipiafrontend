import { useEffect, useRef, useCallback } from 'react';
import { useVideoProgress } from './useVideoProgress';

declare global {
  interface Window {
    pandaPlayer: any;
  }
}

interface PandaTimeUpdateEvent extends CustomEvent {
  detail: {
    currentTime: number;
    duration: number;
  };
}

export const usePandaPlayer = (courseContentId: number, initialTime?: number) => {
  const playerRef = useRef<any>(null);
  const currentTimeRef = useRef<number>(initialTime || 0);
  const { sendHeartbeat, saveFinalProgress } = useVideoProgress(courseContentId);

  // ✅ CORREÇÃO: Usar useCallback para evitar recriação
  const setupPlayerListeners = useCallback(() => {
    console.log('🎧 Configurando listeners do Panda Video...');

    const handleTimeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ currentTime: number; duration: number }>;
      const currentTime = customEvent.detail?.currentTime || 0;
      
      if (currentTime > 0) {
        currentTimeRef.current = currentTime;
        sendHeartbeat(currentTime);
      }
    };

    const handlePlayerReady = (event: Event) => {
      const customEvent = event as CustomEvent<{ player: any }>;
      playerRef.current = customEvent.detail?.player;
      
      console.log('🎬 Player pronto - Continuar Assistindo ativo');
      
      // Seek para posição salva apenas se for significativa (> 10 segundos)
      if (initialTime && initialTime > 10) {
        console.log('⏩ Seek para posição:', initialTime, 's');
        setTimeout(() => {
          try {
            if (playerRef.current && typeof playerRef.current.setCurrentTime === 'function') {
              playerRef.current.setCurrentTime(initialTime);
              console.log('✅ Seek realizado com sucesso');
            }
          } catch (error) {
            console.error('❌ Erro no seek:', error);
          }
        }, 2000); // Aumentei para 2 segundos para garantir que o player está pronto
      }
    };

    // Adicionar listeners
    window.addEventListener('panda_timeupdate', handleTimeUpdate as EventListener);
    window.addEventListener('panda_playerReady', handlePlayerReady as EventListener);

    // Cleanup function
    return () => {
      console.log('🧹 Limpando listeners do Panda Video');
      window.removeEventListener('panda_timeupdate', handleTimeUpdate as EventListener);
      window.removeEventListener('panda_playerReady', handlePlayerReady as EventListener);
    };
  }, [sendHeartbeat, initialTime]); // ✅ Dependências corretas

  return {
    setupPlayerListeners,
    playerRef,
    currentTimeRef,
  };
};
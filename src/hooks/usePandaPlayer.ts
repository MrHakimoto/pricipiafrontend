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

  // Configurar listeners do Panda Video
  const setupPlayerListeners = useCallback(() => {
    const handleTimeUpdate = (event: Event) => {
      const customEvent = event as PandaTimeUpdateEvent;
      const currentTime = customEvent.detail.currentTime;
      
      currentTimeRef.current = currentTime;
      sendHeartbeat(currentTime);
    };

    const handlePlayerReady = (event: Event) => {
      const customEvent = event as CustomEvent;
      playerRef.current = customEvent.detail.player;
      
      console.log('🎬 Player pronto - Continuar Assistindo ativo');
      
      // Se tem tempo inicial, seek para a posição salva
      if (initialTime && initialTime > 10) {
        console.log('⏩ Seek para posição:', initialTime, 's');
        setTimeout(() => {
          try {
            playerRef.current?.setCurrentTime(initialTime);
          } catch (error) {
            console.error('❌ Erro no seek:', error);
          }
        }, 1500);
      }
    };

    // Listeners customizados do Panda Video
    window.addEventListener('panda_timeupdate', handleTimeUpdate as EventListener);
    window.addEventListener('panda_playerReady', handlePlayerReady as EventListener);

    console.log('🎧 Listeners do Panda Video configurados');

    return () => {
      window.removeEventListener('panda_timeupdate', handleTimeUpdate as EventListener);
      window.removeEventListener('panda_playerReady', handlePlayerReady as EventListener);
    };
  }, [sendHeartbeat, initialTime]);

  // Save final quando o componente desmontar
  useEffect(() => {
    return () => {
      const finalTime = currentTimeRef.current;
      console.log('🔚 Componente desmontando - salvando tempo final:', finalTime);
      saveFinalProgress(finalTime);
    };
  }, [saveFinalProgress]);

  return {
    setupPlayerListeners,
    playerRef,
    currentTimeRef,
  };
};
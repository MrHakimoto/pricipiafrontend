import { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface HeartbeatResponse {
  success: boolean;
  message: string;
  progress?: {
    last_watched_timestamp: number;
    is_completed: boolean;
  };
}

export const useVideoProgress = (courseContentId: number) => {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef<number>(0);
  
  // CORREÇÃO: Inicializar com null ou undefined
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async (timestamp: number) => {
    // Throttle: só envia a cada 30 segundos
    const now = Date.now();
    const timeSinceLastSave = now - lastSavedRef.current;
    
    if (timeSinceLastSave < 30000) {
      return;
    }

    // CORREÇÃO: Verificar se existe antes de limpar
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }

    // CORREÇÃO: Usar session.laravelToken com type assertion
    const sessionAny = session as any;
    if (!session || !sessionAny?.laravelToken || !courseContentId) {
      console.log('❌ Sessão ou token não disponível');
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('🔄 Enviando heartbeat:', {
        courseContentId,
        timestamp,
        token: sessionAny.laravelToken ? '✅ Presente' : '❌ Ausente'
      });

      const response = await fetch(`/api/aulas/${courseContentId}/progresso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionAny.laravelToken}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Math.floor(timestamp),
        }),
      });

      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (response.ok) {
        const data: HeartbeatResponse = await response.json();
        lastSavedRef.current = now; // CORREÇÃO: Usar 'now' em vez de 'timestamp'
        console.log('✅ Progresso salvo:', data);
      } else {
        console.error('❌ Erro HTTP:', response.status);
        const errorText = await response.text();
        console.error('📝 Detalhes do erro:', errorText);
      }
    } catch (error) {
      console.error('❌ Erro de rede:', error);
    } finally {
      setIsSaving(false);
    }
  }, [courseContentId, session]);

  const saveFinalProgress = useCallback(async (timestamp: number) => {
    // CORREÇÃO: Usar session.laravelToken com type assertion
    const sessionAny = session as any;
    if (!session || !sessionAny?.laravelToken || !courseContentId) return;

    try {
      console.log('💾 Salvando progresso final:', timestamp);

      await fetch(`/api/aulas/${courseContentId}/progresso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionAny.laravelToken}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Math.floor(timestamp),
          is_final: true,
        }),
      });
      
      console.log('💾 Progresso final salvo:', timestamp, 's');
    } catch (error) {
      console.error('❌ Erro ao salvar progresso final:', error);
    }
  }, [courseContentId, session]);

  return {
    sendHeartbeat,
    saveFinalProgress,
    isSaving,
  };
};
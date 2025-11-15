// src/components/home/ContinueWatching.ts
'use client';

import { useState, useEffect } from 'react';

export interface ContinueWatchingData {
  aula: {
    id: number;
    title: string;
    duration: number;
    module: {
      id: number;
      name: string;
    };
  };
  progress_percentage: number;
  last_watched_timestamp: number;
}

// Hook para buscar dados de "Continuar Assistindo"
export function useContinueWatching() {
  const [data, setData] = useState<ContinueWatchingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContinueWatching = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulação de chamada API - substitua pela sua implementação real
        const mockData: ContinueWatchingData = {
          aula: {
            id: 1,
            title: 'Introdução aos Números Complexos',
            duration: 1800, // 30 minutos em segundos
            module: {
              id: 1,
              name: 'Álgebra Avançada'
            }
          },
          progress_percentage: 65,
          last_watched_timestamp: 720 // 12 minutos em segundos
        };

        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setData(mockData);
      } catch (err) {
        setError('Erro ao carregar dados de continuar assistindo');
        console.error('Error fetching continue watching:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueWatching();
  }, []);

  return { data, loading, error };
}
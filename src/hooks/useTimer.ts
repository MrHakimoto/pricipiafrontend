// hooks/useTimer.ts
"use client";

import { useState, useEffect, useCallback } from 'react';

interface UseTimerProps {
  startedAt: string;
  tempoEscolhido: number;
  isCompleted: boolean;
}

interface UseTimerReturn {
  tempoRestante: number;
  tempoDecorrido: number;
  tempoExcedido: boolean;
  tempoFormatado: string;
  isTimerVisible: boolean;
  toggleTimer: () => void;
}

export function useTimer({ startedAt, tempoEscolhido, isCompleted }: UseTimerProps): UseTimerReturn {
  const [tempoRestante, setTempoRestante] = useState<number>(0);
  const [tempoDecorrido, setTempoDecorrido] = useState<number>(0);
  const [isTimerVisible, setIsTimerVisible] = useState<boolean>(true);

  // Carregar preferência do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('provaTimerVisible');
    if (saved !== null) {
      setIsTimerVisible(JSON.parse(saved));
    }
  }, []);

  // Salvar preferência no localStorage
  const toggleTimer = () => {
    const newValue = !isTimerVisible;
    setIsTimerVisible(newValue);
    localStorage.setItem('provaTimerVisible', JSON.stringify(newValue));
  };

  const calcularTempos = useCallback(() => {
    if (!startedAt || isCompleted) return;

    const startTime = new Date(startedAt).getTime();
    const now = new Date().getTime();
    const tempoTotalMs = tempoEscolhido * 60 * 1000;
    const tempoPassadoMs = now - startTime;
    
    setTempoDecorrido(Math.floor(tempoPassadoMs / 1000));
    setTempoRestante(Math.floor((tempoTotalMs - tempoPassadoMs) / 1000));
  }, [startedAt, tempoEscolhido, isCompleted]);

  useEffect(() => {
    calcularTempos();

    if (isCompleted) return;

    const interval = setInterval(calcularTempos, 1000);
    return () => clearInterval(interval);
  }, [calcularTempos, isCompleted]);

  const formatarTempo = (segundos: number): string => {
    const absSegundos = Math.abs(segundos);
    const minutos = Math.floor(absSegundos / 60);
    const segs = absSegundos % 60;
    const sinal = segundos < 0 ? '-' : '';
    return `${sinal}${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  return {
    tempoRestante,
    tempoDecorrido,
    tempoExcedido: tempoRestante < 0,
    tempoFormatado: formatarTempo(tempoRestante),
    isTimerVisible,
    toggleTimer,
  };
}
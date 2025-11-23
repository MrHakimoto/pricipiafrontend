'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { Check, X, Flame, Calendar } from 'lucide-react'
import { checkinStatus, checkinDaily, getUser } from '@/lib/dailyCheck/daily'
import { getUTCDateString, isToday } from '@/utils/dateHelpers' 

interface UserStreak {
  id: number
  user_id: number
  current_streak: number
  longest_streak: number
  last_checkin_date: string
  has_checked_in_today: boolean
}

type DayStatus = 'done' | 'current' | 'missed' | 'pending'

interface WeekDay {
  name: string
  status: DayStatus
}

const STREAK_KEY = '/api/checkin-status'

// Funções para gerenciar o cookie de check-in
const getCheckinCookie = (): string | null => {
  if (typeof window === 'undefined') return null
  const cookies = document.cookie.split(';')
  const checkinCookie = cookies.find(cookie => cookie.trim().startsWith('daily_checkin='))
  return checkinCookie ? checkinCookie.split('=')[1] : null
}

const setCheckinCookie = (date?: string): void => {
  if (typeof window === 'undefined') return
  const checkinDate = date || getUTCDateString()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
  document.cookie = `daily_checkin=${checkinDate}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
}

export default function WeekProgress() {
  const { data: session } = useSession()
  const token = session?.laravelToken

  const [hasAutoCheckedIn, setHasAutoCheckedIn] = useState<boolean>(false)
  const [animatedStreak, setAnimatedStreak] = useState<number>(0)
  const [loaded, setLoaded] = useState<boolean>(false)

  const {
    data: streakData,
    error,
    isLoading,
    mutate,
  } = useSWR<UserStreak>(
    token ? [STREAK_KEY, token] : null,
    ([key, token]: [string, string]) => checkinStatus(token)
  )

  // Check-in automático RESILIENTE - CORRIGIDO
  useEffect(() => {
    const autoCheckin = async (): Promise<void> => {
      // Verificações iniciais
      if (!token || !streakData) return;

      // Verificar se JÁ temos um check-in bem-sucedido hoje
      const today = getUTCDateString();
      const lastCheckinCookie = getCheckinCookie();

      // Se já fez check-in hoje (confirmado), não faz nada
      if (lastCheckinCookie === today && streakData.has_checked_in_today) {
        setHasAutoCheckedIn(true);
        return;
      }

      try {
        // Se ainda não fez check-in na API
        if (!streakData.has_checked_in_today) {
          const newStreakData = await checkinDaily(token);
          mutate(newStreakData.streak, false);
          setCheckinCookie(today);
          setHasAutoCheckedIn(true);
        } else {
          // Sincronizar o cookie se a API já tem o check-in
          setCheckinCookie(today);
          setHasAutoCheckedIn(true);
        }
      } catch (err) {
        console.error('Falha no check-in automático:', err);
        // Não marca como concluído para tentar novamente
      }
    };

    if (streakData && !isLoading) {
      autoCheckin();

      // Tentar novamente após 30 segundos se ainda não conseguiu
      const retryTimeout = setTimeout(() => {
        const today = getUTCDateString();
        if (!streakData.has_checked_in_today && getCheckinCookie() !== today && !hasAutoCheckedIn) {
          console.log('Tentando check-in automático novamente...');
          autoCheckin();
        }
      }, 30000);

      return () => clearTimeout(retryTimeout);
    }
  }, [streakData, isLoading, token, mutate, hasAutoCheckedIn]); // ✅ CORRETO

  // Animação do número
  useEffect(() => {
    if (!streakData || isLoading) return

    setLoaded(true)

    let start = 0
    const target = streakData.current_streak
    const duration = 1000
    const startTime = performance.now()

    const animateNumber = (timestamp: number): void => {
      const elapsed = timestamp - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)

      const current = Math.floor(eased * target)
      setAnimatedStreak(current)

      if (progress < 1) {
        requestAnimationFrame(animateNumber)
      } else {
        setAnimatedStreak(target)
      }
    }

    requestAnimationFrame(animateNumber)
  }, [streakData, isLoading])

  // Gerar dias da semana baseado no estado atual
  const getWeekDays = (): WeekDay[] => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const today = new Date().getDay()

    return days.map((day, index): WeekDay => {
      let status: DayStatus = 'pending'

      if (index === today) {
        status = streakData?.has_checked_in_today ? 'done' : 'current'
      } else if (index < today) {
        status = streakData?.current_streak! > 0 ? 'done' : 'missed'
      }

      return { name: day, status }
    })
  }

  const DAYS = getWeekDays()

  // Função para formatar o texto do streak
  const getStreakText = (streak: number): string => {
    return streak === 1 ? 'dia' : 'dias'
  }

  if (isLoading) {
    return (
      <div className="flex-1 max-w-sm bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700/50 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-24 mb-6"></div>
        <div className="h-16 bg-gray-700 rounded w-20 mx-auto mb-3"></div>
        <div className="h-4 bg-gray-700 rounded w-16 mx-auto mb-6"></div>
        <div className="flex justify-between mb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-6 h-6 bg-gray-700 rounded-full mb-1"></div>
              <div className="h-2 bg-gray-700 rounded w-3"></div>
            </div>
          ))}
        </div>
        <div className="h-8 bg-gray-700 rounded-full"></div>
      </div>
    )
  }

  if (error || !streakData) {
    return (
      <div className="flex-1 max-w-sm bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700/50 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
          <Calendar size={20} />
          <span className="text-sm">Ofensiva</span>
        </div>
        <p className="text-xs text-gray-500">Não foi possível carregar</p>
      </div>
    )
  }

  const hasCheckedIn = streakData.has_checked_in_today

  return (
    <div className={`flex-1 max-w-sm bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700/50 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

      {/* Header elegante */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">Ofensiva</span>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar size={12} />
          <span>Hoje</span>
        </div>
      </div>

      {/* Streak principal */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-2 mb-1">
          <span className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            {animatedStreak}
          </span>
          <span className="text-lg text-gray-400">{getStreakText(animatedStreak)}</span>
        </div>
        <p className="text-xs text-gray-500">sequência atual</p>
      </div>

      {/* Semana estilizada */}
      <div className="flex justify-between mb-6 px-1">
        {DAYS.map((day, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-7 h-7 flex items-center justify-center rounded-full mb-2 transition-all duration-300 ${
              day.status === "done"
                ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25"
                : day.status === "current"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50"
                : day.status === "missed"
                ? "bg-gradient-to-br from-gray-600 to-gray-700"
                : "bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600/50"
            }`}>
              {day.status === "done" && <Check className="text-white w-3 h-3" />}
              {day.status === "current" && <Check className="text-white w-3 h-3" />}
              {day.status === "missed" && <X className="text-white w-3 h-3" />}
            </div>
            <span className={`text-xs font-medium transition-colors ${
              day.status === "pending" ? "text-gray-500" : "text-gray-300"
            }`}>
              {day.name}
            </span>
          </div>
        ))}
      </div>

      {/* Recorde */}
      <div className="flex items-center justify-between mt-4 text-xs">
        <span className="text-gray-500">Melhor sequência</span>
        <span className="text-orange-400 font-semibold">
          {streakData.longest_streak} {getStreakText(streakData.longest_streak)}
        </span>
      </div>
    </div>
  )
}
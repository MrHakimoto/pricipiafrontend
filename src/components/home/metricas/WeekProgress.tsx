'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { Check, X, Flame, Calendar } from 'lucide-react'
import { checkinStatus, checkinDaily } from '@/lib/dailyCheck/daily'
import { getUTCDateString } from '@/utils/dateHelpers' 

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

export default function WeekProgress() {
  const { data: session } = useSession()
  const token = session?.laravelToken

  const [animatedStreak, setAnimatedStreak] = useState<number>(0)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [needsRefresh, setNeedsRefresh] = useState<boolean>(true)

  const {
    data: streakData,
    error,
    isLoading,
    mutate,
  } = useSWR<UserStreak>(
    token ? [STREAK_KEY, token] : null,
    ([key, token]: [string, string]) => checkinStatus(token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 300000,
      // Forçar refresh se detectarmos inconsistência
      revalidateIfStale: true,
    }
  )

  // DEBUG: Log para verificar os dados recebidos
  useEffect(() => {
    if (streakData) {
      console.log('📊 Dados do Streak recebidos:', {
        current_streak: streakData.current_streak,
        longest_streak: streakData.longest_streak,
        last_checkin_date: streakData.last_checkin_date,
        has_checked_in_today: streakData.has_checked_in_today
      })
    }
  }, [streakData])

  // Check-in automático SIMPLIFICADO
  useEffect(() => {
    const autoCheckin = async (): Promise<void> => {
      if (!token || !streakData || isLoading) return

      const today = getUTCDateString()
      const lastCheckin = localStorage.getItem('daily_checkin_date')

      // Evita check-in duplicado no mesmo dia
      if (lastCheckin === today && streakData.has_checked_in_today) {
        return
      }

      try {
        if (!streakData.has_checked_in_today) {
          console.log('🔄 Tentando check-in automático...')
          await checkinDaily(token)
          // Força uma revalidação completa
          mutate(undefined, { revalidate: true })
        }
        
        // Marca como feito
        localStorage.setItem('daily_checkin_date', today)
      } catch (err) {
        console.error('❌ Falha no check-in automático:', err)
      }
    }

    if (streakData && !isLoading) {
      autoCheckin()
    }
  }, [token, streakData, isLoading, mutate])

  // Animação do número - CORRIGIDA para forçar atualização
  useEffect(() => {
    if (!streakData || isLoading) return

    setLoaded(true)

    const target = streakData.current_streak
    
    // Se o streak mudou drasticamente, anima do zero
    if (Math.abs(target - animatedStreak) > 1) {
      setAnimatedStreak(0)
    }

    const duration = 1000
    const startTime = performance.now()
    const startValue = animatedStreak

    const animateNumber = (timestamp: number): void => {
      const elapsed = timestamp - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)

      const current = Math.floor(startValue + (eased * (target - startValue)))
      setAnimatedStreak(current)

      if (progress < 1) {
        requestAnimationFrame(animateNumber)
      } else {
        setAnimatedStreak(target)
      }
    }

    requestAnimationFrame(animateNumber)
  }, [streakData?.current_streak, isLoading])

  // Função para forçar refresh dos dados
  const forceRefresh = () => {
    mutate(undefined, { revalidate: true })
    setNeedsRefresh(false)
  }

  // Gerar dias da semana baseado no estado atual - MELHORADA
  const getWeekDays = (): WeekDay[] => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const today = new Date().getDay()

    return days.map((day, index): WeekDay => {
      let status: DayStatus = 'pending'

      if (index === today) {
        // Dia atual
        status = streakData?.has_checked_in_today ? 'done' : 'current'
      } else if (index < today) {
        // Dias passados - simplificado por enquanto
        // Em uma versão futura, você pode verificar datas específicas
        status = 'missed'
      }

      return { name: day, status }
    })
  }

  const DAYS = getWeekDays()

  // Função para formatar o texto do streak
  const getStreakText = (streak: number): string => {
    return streak === 1 ? 'dia' : 'dias'
  }

  // Detectar inconsistência nos dados
  const hasDataInconsistency = streakData && 
    streakData.current_streak === 1 && 
    streakData.longest_streak >= 5

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
        <button 
          onClick={forceRefresh}
          className="mt-2 px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 rounded transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className={`flex-1 max-w-sm bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700/50 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

      {/* Header elegante com botão de refresh */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">Ofensiva</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar size={12} />
            <span>Hoje</span>
          </div>
          {(hasDataInconsistency || needsRefresh) && (
            <button 
              onClick={forceRefresh}
              className="text-xs bg-orange-500 hover:bg-orange-600 px-2 py-1 rounded transition-colors"
              title="Atualizar dados"
            >
              ↻
            </button>
          )}
        </div>
      </div>

      {/* Aviso de inconsistência */}
      {hasDataInconsistency && (
        <div className="mb-4 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-200">
          ⚠️ Dados inconsistentes detectados. 
          <button 
            onClick={forceRefresh}
            className="ml-1 underline hover:text-yellow-100"
          >
            Clique para corrigir
          </button>
        </div>
      )}

      {/* Streak principal */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-2 mb-1">
          <span className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            {animatedStreak}
          </span>
          <span className="text-lg text-gray-400">{getStreakText(animatedStreak)}</span>
        </div>
        <p className="text-xs text-gray-500">sequência atual</p>
        
        {/* Debug info - remover em produção */}
        <div className="mt-2 text-xs text-gray-600">
          Último check-in: {streakData.last_checkin_date}
        </div>
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
              {day.status === "current" && <div className="w-2 h-2 bg-white rounded-full"></div>}
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

      {/* Status do check-in hoje */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className="text-gray-500">Check-in hoje</span>
        <span className={`font-semibold ${streakData.has_checked_in_today ? 'text-green-400' : 'text-red-400'}`}>
          {streakData.has_checked_in_today ? '✅ Realizado' : '❌ Pendente'}
        </span>
      </div>
    </div>
  )
}
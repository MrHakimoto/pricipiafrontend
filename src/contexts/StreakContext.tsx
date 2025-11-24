// contexts/StreakContext.tsx
'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
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

interface StreakContextType {
  streakData: UserStreak | undefined
  isLoading: boolean
  error: any
  mutate: () => void
}

const StreakContext = createContext<StreakContextType | undefined>(undefined)

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const token = session?.laravelToken

  const {
    data: streakData,
    error,
    isLoading,
    mutate,
  } = useSWR<UserStreak>(
    token ? ['/checkin-status', token] : null,
    ([url, token]: [string, string]) => checkinStatus(token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5 minutos
    }
  )

  // Check-in automático global
  useEffect(() => {
    const autoCheckin = async (): Promise<void> => {
      if (!token || !streakData) return
      
      const today = getUTCDateString()
      const lastCheckinCookie = getCheckinCookie()
      
      // Verificar se já fez check-in hoje
      if (lastCheckinCookie === today && streakData.has_checked_in_today) {
        return
      }

      try {
        if (!streakData.has_checked_in_today) {
          const newStreakData = await checkinDaily(token)
          mutate(newStreakData.streak, false)
          setCheckinCookie(today)
        } else {
          setCheckinCookie(today)
        }
      } catch (err) {
        console.error('Falha no check-in automático:', err)
      }
    }

    if (streakData && !isLoading) {
      autoCheckin()
    }
  }, [streakData, isLoading, token, mutate])

  // Funções de cookie (manter as mesmas)
  const getCheckinCookie = (): string | null => {
    if (typeof window === 'undefined') return null
    const cookies = document.cookie.split(';')
    const checkinCookie = cookies.find(cookie => cookie.trim().startsWith('daily_checkin='))
    return checkinCookie ? checkinCookie.split('=')[1] : null
  }

  const setCheckinCookie = (date?: string): void => {
    if (typeof window === 'undefined') return
    const checkinDate = date || getUTCDateString()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    document.cookie = `daily_checkin=${checkinDate}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
  }

  return (
    <StreakContext.Provider value={{ streakData, isLoading, error, mutate }}>
      {children}
    </StreakContext.Provider>
  )
}

export function useStreak() {
  const context = useContext(StreakContext)
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider')
  }
  return context
}
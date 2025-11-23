// components/home/UserCard.tsx
'use client'

import { Star, MapPin, Trophy } from 'lucide-react'
import Link from 'next/link'
import UserAvatar from '../UserAvatar'
import { useEffect, useState } from 'react'
import { UserStatus, getGamificationStatus, getLeaderboard } from '@/lib/gamification/gamification'

type Props = {
  nome: string | null
  token: string
}

export default function UserCard({ nome, token }: Props) {
  const [status, setStatus] = useState<UserStatus | null>(null)
  const [myRank, setMyRank] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGamificationData()
  }, [token])

  const loadGamificationData = async () => {
    try {
      setLoading(true)
      const [statusData, leaderboardData] = await Promise.all([
        getGamificationStatus(token),
        getLeaderboard(token)
      ])
      
      setStatus(statusData)
      setMyRank(leaderboardData.my_rank)
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="relative border border-gray-700 rounded-2xl pl-10 py-8 shadow-lg h-30 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-600"></div>
          <div className="h-4 bg-gray-600 rounded w-32"></div>
        </div>
        <div className="absolute bottom-0 right-0 px-4 py-3 bg-gray-600 rounded-tl-2xl rounded-br-2xl w-64 h-12"></div>
      </div>
    )
  }

  return (
    <div className="relative border border-gray-700 rounded-2xl pl-10 py-8 shadow-lg h-30">
      {/* Topo - Nome e avatar */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-2xl">
          <UserAvatar className="w-16 h-16" ring />
        </div>
        <div>
          <h3 className="font-bold text-xl">{nome}</h3>
          {status && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status.rank_title} • {status.streak} dias de streak
            </p>
          )}
        </div>
      </div>

      {/* Barra de Progresso (opcional) */}
      {status && (
        <div className="mt-3 w-64">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Nível {status.level}</span>
            <span>{status.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.progress_percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Inferior direito - Dados de Gamificação */}
      <div className="absolute text-dark dark:text-white bottom-0 right-0 px-4 py-3 bg-[#d7d7d7] dark:bg-[#1B1F27] rounded-tl-2xl rounded-br-2xl flex items-center gap-6 shadow-md">
        {/* Pontos */}
        <div className="flex items-center gap-2">
          <span className="text-dark dark:text-white font-semibold">
            <span className="w-8 h-8 bg-[#0E00D0] text-white p-1 rounded-full text-sm font-semibold flex items-center justify-center">
              {status?.points.toString().slice(0,2) || '0'}π
            </span> 
          </span>
        </div>

        {/* Nível */}
        <div className="flex items-center gap-1 text-black dark:text-gray-300">
          <Star size={16} className="text-yellow-400" />
          <span>Nível {status?.level || 1}</span>
        </div>

        {/* Ranking */}
        <div className="flex items-center gap-1 text-black dark:text-gray-300">
          <Trophy size={16} className="text-yellow-500" />
          <span>Rank #{myRank || '?'}</span>
        </div>

        {/* Localização (opcional) */}

        <Link href={'/perfil'}>
          <button className="cursor-pointer text-white bg-[#8F8F8F] dark:bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
            Meu Perfil
          </button>
        </Link>
      </div>
    </div>
  )
}
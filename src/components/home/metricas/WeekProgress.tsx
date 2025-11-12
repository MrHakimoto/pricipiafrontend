'use client'

import { Flame, Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'

// 1. Importe suas funções da API
import { checkinStatus, checkinDaily } from '@/lib/dailyCheck/daily' // Ajuste o caminho se necessário

// 2. Defina o tipo de dados que a API retorna
interface UserStreak {
  id: number;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string;
  has_checked_in_today: boolean;
}

// 3. Chave de cache para o SWR
const STREAK_KEY = '/api/checkin-status'

export default function WeekProgress() {
  const { data: session } = useSession()
  const token = session?.laravelToken

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 4. Hook de busca de dados (SWR)
  // Ele busca o status assim que o componente é montado
  const {
    data: streakData,
    error,
    isLoading,
    mutate, // A 'mutate' é a função mágica para atualizar a UI
  } = useSWR<UserStreak>(
    token ? [STREAK_KEY, token] : null, // Só busca se o token existir
    ([key, token]) => checkinStatus(token as string)
  )

  // 5. Função para fazer o Check-in
  const handleCheckin = async () => {
    if (!token) return
    setIsSubmitting(true)

    try {
      // Chama a API de check-in
      const newStreakData = await checkinDaily(token)
      
      // 6. ATUALIZAÇÃO MÁGICA (Otimista)
      // Atualiza a UI instantaneamente com os novos dados,
      // sem precisar de um novo 'fetch'.
      mutate(newStreakData.streak, false) // 'false' impede uma re-busca desnecessária
      
    } catch (err) {
      console.error('Falha ao fazer check-in:', err)
      // Adicionar um toast de erro aqui seria uma boa
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Estados de UI ---
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 min-h-[220px] flex justify-center items-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  if (error || !streakData) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 min-h-[220px] text-center">
        <h2 className="text-lg font-semibold mb-2 text-red-500">Erro</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Não foi possível carregar seu progresso.</p>
      </div>
    )
  }

  // --- Variáveis de estado ---
  const hasCheckedIn = streakData.has_checked_in_today
  const currentStreak = streakData.current_streak

  return (
    <motion.div
      layout // Anima a mudança de altura
      className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Ofensiva de Check-in
      </h2>
      
      {/* Visual Central */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Flame
            className={`w-20 h-20 transition-all duration-300 ${
              hasCheckedIn
                ? 'text-orange-500 fill-orange-500 shadow-[0_0_25px_theme(colors.orange.500)]'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          />
        </motion.div>
        
        {/* Animação do número mudando */}
        <div className="relative h-16 w-16">
          <AnimatePresence>
            <motion.span
              key={currentStreak} // Isso faz a animação rodar toda vez que o número muda
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-gray-900 dark:text-white"
            >
              {currentStreak}
            </motion.span>
          </AnimatePresence>
        </div>
        
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          dias de ofensiva
        </p>
      </div>

      {/* Botão de Ação / Mensagem de Concluído */}
      <div className="h-20">
        <AnimatePresence mode="wait">
          {!hasCheckedIn ? (
            // --- ESTADO 1: Botão de Check-in ---
            <motion.div
              key="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button
                onClick={handleCheckin}
                disabled={isSubmitting}
                className="w-full h-12 px-6 font-semibold text-white rounded-lg transition-all duration-300 
                           bg-blue-600 hover:bg-blue-700 
                           dark:bg-[#0E00D0] dark:hover:bg-blue-800
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                           disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  'Fazer check-in de hoje'
                )}
              </button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                Sua maior ofensiva foi de {streakData.longest_streak} dias!
              </p>
            </motion.div>
          ) : (
            // --- ESTADO 2: Check-in Concluído ---
            <motion.div
              key="checked"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <div
                className="w-full h-12 px-6 font-semibold rounded-lg flex items-center justify-center gap-2
                           bg-green-100 text-green-800
                           dark:bg-green-500/10 dark:text-green-400
                           border border-green-300 dark:border-green-500/30"
              >
                <Check className="w-5 h-5" />
                Check-in de hoje concluído!
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                Bom trabalho. Volte amanhã para manter sua ofensiva.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
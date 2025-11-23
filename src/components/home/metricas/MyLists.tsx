// components/home/metricas/MyLists.tsx
'use client'

import { motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import type { ListasFeitasResponse, ListaItem } from '@/lib/dashboard/stats'

interface MyListsProps {
  totalListas?: number;
  totalSimulados?: number;
  listas?: ListaItem[];
}

export default function MyLists({ 
  totalListas = 0, 
  totalSimulados = 0,
  listas = []
}: MyListsProps) {
  const defaultLists: ListaItem[] = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    name: `Lista ${i + 1}`,
    progress: Math.floor(Math.random() * 100),
    type: i % 3 === 0 ? 'simulado' : 'exercicio' as const
  }))

  const displayLists = listas.length > 0 ? listas : defaultLists

  const getListIcon = (type: ListaItem['type']): string => {
    const icons = {
      simulado: '📝',
      prova: '🎯',
      exercicio: '📚',
      revisao: '🔁'
    }
    return icons[type]
  }

  const getListColor = (type: ListaItem['type']): string => {
    const colors = {
      simulado: 'text-orange-400',
      prova: 'text-red-400',
      exercicio: 'text-blue-400',
      revisao: 'text-purple-400'
    }
    return colors[type]
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-xl">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Minhas Listas</h2>
        </div>
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full px-3 py-1 text-xs font-semibold">
          {totalListas} Listas
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Concluídas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalListas}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Simulados</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalSimulados}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {displayLists.map((list) => (
          <motion.div
            key={list.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-xl h-20 flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold ${getListColor(list.type)}`}>
                {getListIcon(list.type)}
              </span>
              <span className="text-gray-900 dark:text-white text-xs font-medium truncate">
                {list.name}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${list.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{list.progress}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
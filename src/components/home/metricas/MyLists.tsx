// components/MyLists.tsx
'use client'

import { motion } from 'framer-motion'
import { ClipboardList, TrendingUp } from 'lucide-react'

interface MyListsProps {
  totalListas?: number;
  totalSimulados?: number;
}

export default function MyLists({ totalListas = 10, totalSimulados = 3 }: MyListsProps) {
  const lists = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    name: `Lista ${i + 1}`,
    progress: Math.floor(Math.random() * 100),
    type: i % 3 === 0 ? 'simulado' : 'exercicio'
  }))

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-2xl p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-xl">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Minhas Listas</h2>
        </div>
        <span className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg">
          {totalListas} Listas
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Concluídas</p>
          <p className="text-2xl font-bold text-white">{totalListas}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Simulados</p>
          <p className="text-2xl font-bold text-green-400">{totalSimulados}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {lists.map((list) => (
          <motion.div
            key={list.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl h-20 flex flex-col items-center justify-center p-3 border border-gray-600 cursor-pointer shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold ${
                list.type === 'simulado' ? 'text-orange-400' : 'text-blue-400'
              }`}>
                {list.type === 'simulado' ? '📝' : '📚'}
              </span>
              <span className="text-white text-xs font-medium truncate">
                {list.name}
              </span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${list.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 mt-1">{list.progress}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
// components/home/metricas/MetricsSection.tsx
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { Target, CheckCircle, XCircle } from 'lucide-react'
import type { AcertosErrosResponse } from '@/lib/dashboard/stats'

interface MetricsSectionProps {
  acertos?: number;
  erros?: number;
  total?: number;
  taxaAcerto?: string;
}

export default function MetricsSection({ 
  acertos = 0, 
  erros = 0, 
  total = 0,
  taxaAcerto = "0%"
}: MetricsSectionProps) {
  const data = [
    { name: 'Certas', value: acertos },
    { name: 'Erradas', value: erros },
  ]

  const COLORS = ['#10B981', '#EF4444']
  
  const questions = Array.from({ length: 9 }, (_, i) => `Q${i + 1}`)

  const getQuestionColor = (index: number): string => {
    if (index % 3 === 0) return 'bg-green-500 hover:bg-green-600 text-white'
    if (index % 3 === 1) return 'bg-red-500 hover:bg-red-600 text-white'
    return 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500 rounded-xl">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Métricas de Performance</h2>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-28 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index]} 
                    stroke="transparent"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-900 dark:text-white font-bold text-lg">{taxaAcerto}</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-300 text-sm">Acertos</span>
            </div>
            <div className="text-right">
              <p className="text-gray-900 dark:text-white font-bold text-lg">{acertos}</p>
              <p className="text-green-500 text-xs font-semibold">
                {total > 0 ? ((acertos / total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600 dark:text-gray-300 text-sm">Erros</span>
            </div>
            <div className="text-right">
              <p className="text-gray-900 dark:text-white font-bold text-lg">{erros}</p>
              <p className="text-red-500 text-xs font-semibold">
                {total > 0 ? ((erros / total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              Total: <span className="text-gray-900 dark:text-white font-bold">{total}</span> questões
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {questions.map((q, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
              rounded-xl h-16 flex items-center justify-center text-sm font-semibold
              cursor-pointer transition-all shadow-sm
              ${getQuestionColor(i)}
            `}
          >
            {q}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
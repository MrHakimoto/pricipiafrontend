// components/MetricsSection.tsx
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { Target, CheckCircle, XCircle } from 'lucide-react'

interface MetricsSectionProps {
  acertos?: number;
  erros?: number;
  total?: number;
  taxaAcerto?: string;
}

export default function MetricsSection({ 
  acertos = 80, 
  erros = 20, 
  total = 100,
  taxaAcerto = "80%"
}: MetricsSectionProps) {
  const data = [
    { name: 'Certas', value: acertos },
    { name: 'Erradas', value: erros },
  ]

  const COLORS = ['#10B981', '#EF4444']
  const questions = Array.from({ length: 9 }, (_, i) => `Q${i + 1}`)

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500 rounded-xl">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Métricas de Performance</h2>
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
            <span className="text-white font-bold text-lg">{taxaAcerto}</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300 text-sm">Acertos</span>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg">{acertos}</p>
              <p className="text-green-400 text-xs font-semibold">
                {((acertos / total) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-gray-300 text-sm">Erros</span>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg">{erros}</p>
              <p className="text-red-400 text-xs font-semibold">
                {((erros / total) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-600">
            <p className="text-center text-gray-400 text-sm">
              Total: <span className="text-white font-bold">{total}</span> questões
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
              cursor-pointer transition-all shadow-lg
              ${i % 3 === 0 
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' 
                : i % 3 === 1 
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                : 'bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300'
              }
            `}
          >
            {q}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
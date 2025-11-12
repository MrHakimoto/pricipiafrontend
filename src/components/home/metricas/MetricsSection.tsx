'use client'

import { PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'

const COLORS = ['#00C49F', '#FF4444']

const data = [
  { name: 'Certas', value: 80 },
  { name: 'Erradas', value: 20 },
]

export default function MetricsSection() {
  const questions = Array.from({ length: 9 }, (_, i) => `Questão ${i + 1}`)

  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Métricas</h2>

      <div className="flex items-center gap-4 mb-4">
        <PieChart width={80} height={80}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={26}
            outerRadius={38}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>

        <div>
          <p className="text-xl font-medium">100 Questões</p>
          <p className="text-green-400 text-sm">✔ 80</p>
          <p className="text-red-400 text-sm">✖ 20</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {questions.map((q, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800 rounded-lg h-16 flex items-center justify-center text-sm text-gray-300"
          >
            {q}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'

const lists = Array.from({ length: 9 }, (_, i) => `Lista ${i + 1}`)

export default function MyLists() {
  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Minhas Listas</h2>
        <span className="bg-blue-600 rounded-full px-2 py-1 text-xs">B</span>
      </div>

      <div className="text-gray-300 text-sm mb-3">
        <p className="font-medium text-xl">10 Listas</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {lists.map((list, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800 rounded-lg h-16 flex items-center justify-center text-sm text-gray-300"
          >
            {list}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

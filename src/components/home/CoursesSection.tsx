'use client'

import { motion } from 'framer-motion'

export default function ContinueWatching() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Continuar assistindo</h2>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex gap-6 overflow-x-auto pb-2"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="min-w-[260px] rounded-xl overflow-hidden bg-gray-800 shadow-md cursor-pointer"
        >
          <img
            src="https://cdn.fisiquei.com.br/lesson-attachments/example.png"
            alt="Princípios de Matemática Básica"
            className="w-full h-40 object-cover"
          />
          <div className="p-4 text-sm">
            <p className="font-medium">Princípios de Matemática Básica: Aula 01</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

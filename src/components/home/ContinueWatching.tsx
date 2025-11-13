'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface Item {
  id: string | number
  name: string
  content_avatar: string
}

interface ContinueWatchingProps {
  items: Item[]
}

export default function ContinueWatching({ items }: ContinueWatchingProps) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-4 text-white">Continuar assistindo</h2>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide"
      >
        {items.map((item: any) => (
          <Link key={item.id} href={`/conteudo/tv/${item.id}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="
                min-w-[260px]
                bg-[#111827] rounded-xl overflow-hidden shadow-lg 
                hover:shadow-xl transition-all duration-300
                cursor-pointer
              "
            >
              <div className="overflow-hidden">
                <img
                  src={item.content_avatar}
                  alt={item.name}
                  className="w-full h-40 object-cover hover:scale-110 transition-all duration-500"
                />
              </div>

              <div className="p-4 text-white text-sm">
                <p className="font-medium truncate">{item.name}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </section>
  )
}

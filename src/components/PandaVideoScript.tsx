// components/PandaPlayer.tsx
'use client'

import { useState } from 'react'

interface PandaPlayerProps {
  contentUrl: string
  startTime?: number
  onTimeUpdate?: (time: number) => void
}

export default function PandaPlayer({ contentUrl, startTime = 0, onTimeUpdate }: PandaPlayerProps) {
  const [loading, setLoading] = useState(true)

  // Adiciona timestamp à URL se necessário
  const getVideoUrl = () => {
    if (startTime > 0) {
      // Depende de como o PandaVideo aceita timestamp
      return `${contentUrl}#t=${startTime}`
    }
    return contentUrl
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Carregando vídeo...</p>
          </div>
        </div>
      )}
      
      <iframe
        src={getVideoUrl()}
        className="w-full h-full rounded-lg border-0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}
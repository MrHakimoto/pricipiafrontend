'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { fetchActiveBanners } from '@/lib/dashboard/banner'
import { useSession } from 'next-auth/react'

interface Banner {
  id: number
  title: string
  image_url?: string
  link_url?: string
  target_blank: boolean
  is_active: boolean
  position: number
  scheduled_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTitle, setShowTitle] = useState(false)

  const { data: session } = useSession();

  // Fetch dos banners ativos
  useEffect(() => {
    const loadBanners = async () => {
      try {
        setLoading(true)
        const token = `${session?.laravelToken}`
        const activeBanners = await fetchActiveBanners(token)
        
        if (activeBanners && activeBanners.length > 0) {
          setBanners(activeBanners)
        } else {
          // Fallback para os slides padrão caso não haja banners
          setBanners([
            {
              id: 1,
              title: "Entre no Grupo VIP do PME e receba materiais exclusivos",
              image_url: "",
              link_url: "",
              target_blank: false,
              is_active: true,
              position: 0,
              scheduled_at: null,
              expires_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 2,
              title: "Acompanhe os novos cursos e desafios",
              image_url: "",
              link_url: "",
              target_blank: false,
              is_active: true,
              position: 1,
              scheduled_at: null,
              expires_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 3,
              title: "Ganhe recompensas estudando todos os dias",
              image_url: "",
              link_url: "",
              target_blank: false,
              is_active: true,
              position: 2,
              scheduled_at: null,
              expires_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
        }
      } catch (err) {
        console.error('Erro ao carregar banners:', err)
        setError('Erro ao carregar banners')
        
        // Fallback em caso de erro
        setBanners([
          {
            id: 1,
            title: "Entre no Grupo VIP do PME e receba materiais exclusivos",
            image_url: "",
            link_url: "",
            target_blank: false,
            is_active: true,
            position: 0,
            scheduled_at: null,
            expires_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            title: "Acompanhe os novos cursos e desafios",
            image_url: "",
            link_url: "",
            target_blank: false,
            is_active: true,
            position: 1,
            scheduled_at: null,
            expires_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 3,
            title: "Ganhe recompensas estudando todos os dias",
            image_url: "",
            link_url: "",
            target_blank: false,
            is_active: true,
            position: 2,
            scheduled_at: null,
            expires_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    if (session?.laravelToken) {
      loadBanners()
    }
  }, [session?.laravelToken])

  // Auto-rotate dos banners
  useEffect(() => {
    if (banners.length === 0) return

    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length])

  // Função para lidar com clique no banner
  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      if (banner.target_blank) {
        window.open(banner.link_url, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = banner.link_url
      }
    }
  }

  if (loading) {
    return (
      <div className="relative w-full h-48 bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl overflow-hidden mt-5">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg font-semibold text-white">Carregando...</div>
        </div>
      </div>
    )
  }

  if (error && banners.length === 0) {
    return (
      <div className="relative w-full h-48 bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl overflow-hidden mt-5">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg font-semibold text-white">{error}</div>
        </div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[index]

  return (
    <div 
      className="relative w-full h-48 rounded-2xl overflow-hidden mt-5 cursor-pointer group"
      onClick={() => handleBannerClick(currentBanner)}
      onMouseEnter={() => setShowTitle(true)}
      onMouseLeave={() => setShowTitle(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full h-full"
        >
          {/* Imagem ocupando todo o espaço */}
          {currentBanner.image_url ? (
            <img 
              src={currentBanner.image_url} 
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-700 to-blue-900" />
          )}

          {/* Overlay com título que aparece apenas no hover */}
          {/* <div className={`
            absolute inset-0 bg-black bg-opacity-60 transition-all duration-300
            flex items-center justify-center
            ${showTitle ? 'opacity-100' : 'opacity-0'}
          `}>
            <h2 className="text-lg md:text-xl font-semibold text-white text-center max-w-3xl mx-auto px-4">
              {currentBanner.title}
            </h2>
          </div> */}

          {/* Indicador de link */}
          {currentBanner.link_url && (
            <div className="absolute top-3 right-3 bg-white/20 rounded-full p-2 backdrop-blur-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Indicadores na parte inferior */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex justify-center gap-2">
        {banners.map((banner, i) => (
          <button
            key={banner.id}
            onClick={(e) => {
              e.stopPropagation()
              setIndex(i)
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === index ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`Ir para banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
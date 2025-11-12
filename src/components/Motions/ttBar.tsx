// src/hooks/useProgressBar.ts
import { useEffect, useRef, useState } from 'react'

export function TtBar() {
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = () => {
    setLoading(true)
    setProgress(0)

    intervalRef.current = setInterval(() => {
      setProgress(prev => (prev < 95 ? prev + 5 : prev))
    }, 200)
  }

  const finish = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setProgress(100)

    setTimeout(() => {
      setProgress(0)
      setLoading(false)
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { loading, progress, start, finish }
}

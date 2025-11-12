"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useState, useEffect } from "react"

export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Garante que o componente só seja renderizado no cliente
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Retorna um placeholder ou nada para evitar hydration mismatch
    return (
      <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center" />
    );
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="hover:text-white text-[#DBD9D9] cursor-pointer w-12 h-12 rounded-full bg-[#1F293C] flex items-center justify-center transition-all duration-300 hover:bg-[#2A374B] hover:border hover:border-[#0E00D0] hover:shadow-lg hover:shadow-blue-500/20
      dark:text-[#DBD9D9] dark:bg-[#1F293C] dark:hover:bg-[#2A374B] dark:hover:border-[#0E00D0]
      light:text-gray-600 light:bg-gray-200 light:hover:bg-gray-300 light:hover:border-blue-500"
      aria-label={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
    >
      {isLight ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
    </button>
  )
}
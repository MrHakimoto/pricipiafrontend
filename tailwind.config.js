/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Adiciona o modo 'class' para o Light/Dark mode
  darkMode: 'class',

  // 2. Suas configurações de 'content'
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],

  // 3. Funde o 'theme.extend'
  theme: {
    extend: {
      // Suas animações customizadas
      animation: {
        'spin-slow': 'spin 2.5s linear infinite',
        draw: 'drawUndraw 5s ease-in-out infinite',
      },
      keyframes: {
        drawUndraw: {
          '0%': { strokeDashoffset: 'var(--path-length)', opacity: '1' },
          '50%': { strokeDashoffset: '0', opacity: '1' },
          '100%': { strokeDashoffset: 'var(--path-length)', opacity: '1' },
        }
      }
    },
  },

  // 4. Seus plugins (como o @tailwindcss/typography)
  plugins: [],
};
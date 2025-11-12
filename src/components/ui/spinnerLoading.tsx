import React from 'react';

// --- Componente do Spinner de Carregamento ---
// Este componente é autônomo. Ele contém o SVG e sua própria animação.
// Você pode copiá-lo para uma pasta /components no seu projeto.

type Prop = {
    className: string;
}

export const LoadingSpinner = ({ className }: Prop) => {
  return (
    <>
      {/* A animação com @keyframes não é suportada diretamente por classes do Tailwind.
        A melhor abordagem para manter o componente encapsulado é usar uma tag <style> com JSX.
        Isso garante que a animação esteja sempre junto com o SVG, sem poluir o CSS global.
      */}
      <style>
        {`
          .logo-path-animate {
            /* O comprimento do traço (dash) e o espaçamento (gap). Um valor alto garante que o traço seja sólido. */
            stroke-dasharray: 1200;
            /* O ponto inicial do traço. Começa "escondido". */
            stroke-dashoffset: 1200;
            /* Aplica a animação 'draw' definida abaixo */
            animation: draw 3s ease-in-out infinite;
          }

          @keyframes draw {
            0% {
              stroke-dashoffset: 1200;
            }
            50% {
              stroke-dashoffset: 0;
            }
            100% {
              stroke-dashoffset: -1200;
            }
          }
        `}
      </style>
      <svg
        viewBox="0 0 360 360"
        xmlns="http://www.w3.org/2000/svg"
        // Permite passar classes do Tailwind (como w-16, h-16) para controlar o tamanho
        className={className}
      >
        <path
          className="logo-path-animate"
          d="M27 47 L332 47 L256 179 L179 180 L217 245 L180 311 L104 180 L179 180 L218 113 L64 112 Z"
          // A cor é definida diretamente, mas poderia ser 'currentColor' para herdar a cor do texto do elemento pai
          stroke="#0A4A8E"
          strokeWidth="10"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
};



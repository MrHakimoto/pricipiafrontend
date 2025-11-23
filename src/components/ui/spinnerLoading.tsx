import React from 'react';

type Prop = {
    className?: string;
};

export const LoadingSpinner = ({ className }: Prop) => {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white dark:bg-[#00091A]">
      {/* Estilos encapsulados para a animação do SVG */}
      <style>
        {`
          .logo-path-animate {
            stroke-dasharray: 1200;
            stroke-dashoffset: 1200;
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

          .gradient-path {
            stroke: url(#gradient);
          }
        `}
      </style>

      <svg
        viewBox="0 0 360 360"
        xmlns="http://www.w3.org/2000/svg"
        className={`mx-auto ${className || 'w-[60vw] h-[60vw] sm:w-[40vw] sm:h-[40vw] md:w-[30vw] md:h-[30vw]'}`}
      >
        {/* Gradiente para o traço */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0A4A8E" />
            <stop offset="50%" stopColor="#4DA1FF" />
            <stop offset="100%" stopColor="#0A4A8E" />
          </linearGradient>
        </defs>

        <path
          className="logo-path-animate gradient-path"
          d="M27 47 L332 47 L256 179 L179 180 L217 245 L180 311 L104 180 L179 180 L218 113 L64 112 Z"
          strokeWidth="12"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// components/questions/PrincipiaQuestionBanner.tsx
"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  FunctionSquare,
  Sigma,
  Sparkles,
} from "lucide-react";

function PrincipiaOrbitSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <style>
        {`
          .principia-orbit {
            animation: principia-orbit-spin 8s linear infinite;
            transform-origin: center;
          }

          .principia-orbit-reverse {
            animation: principia-orbit-spin-reverse 6s linear infinite;
            transform-origin: center;
          }

          .principia-pulse {
            animation: principia-pulse 2.2s ease-in-out infinite;
            transform-origin: center;
          }

          .principia-draw {
            stroke-dasharray: 900;
            stroke-dashoffset: 900;
            animation: principia-draw 3.4s ease-in-out infinite;
          }

          @keyframes principia-orbit-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes principia-orbit-spin-reverse {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }

          @keyframes principia-pulse {
            0%, 100% {
              transform: scale(0.96);
              opacity: 0.72;
            }
            50% {
              transform: scale(1.04);
              opacity: 1;
            }
          }

          @keyframes principia-draw {
            0% {
              stroke-dashoffset: 900;
              opacity: 0.45;
            }
            45% {
              stroke-dashoffset: 0;
              opacity: 1;
            }
            100% {
              stroke-dashoffset: -900;
              opacity: 0.45;
            }
          }
        `}
      </style>

      <svg
        viewBox="0 0 220 220"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient
            id="principia-orbit-gradient-banner"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#0E00D0" />
            <stop offset="48%" stopColor="#4DA1FF" />
            <stop offset="100%" stopColor="#D5A900" />
          </linearGradient>

          <filter id="principia-glow-banner">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="110"
          cy="110"
          r="78"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
        />

        <g className="principia-orbit">
          <circle
            cx="110"
            cy="110"
            r="88"
            fill="none"
            stroke="url(#principia-orbit-gradient-banner)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="72 320"
            filter="url(#principia-glow-banner)"
          />
          <circle cx="198" cy="110" r="5" fill="#4DA1FF" />
        </g>

        <g className="principia-orbit-reverse">
          <circle
            cx="110"
            cy="110"
            r="60"
            fill="none"
            stroke="rgba(213,169,0,0.7)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="42 240"
          />
          <circle cx="170" cy="110" r="4" fill="#D5A900" />
        </g>

        <g className="principia-pulse">
          <path
            className="principia-draw"
            d="M54 70 L166 70 L138 116 L110 116 L124 142 L110 168 L82 116 L110 116 L124 92 L68 92 Z"
            fill="rgba(14,0,208,0.08)"
            stroke="url(#principia-orbit-gradient-banner)"
            strokeWidth="7"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>

        <text
          x="110"
          y="116"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.72)"
          fontSize="22"
          fontWeight="800"
          fontFamily="Arial, sans-serif"
        >
          ?
        </text>
      </svg>
    </div>
  );
}

type PrincipiaQuestionBannerProps = {
  href?: string;
  title?: string;
  subtitle?: string;
  label?: string;
  cta?: string;
  className?: string;
};

export function PrincipiaQuestionBanner({
  href = "/exercicios",
  label = "Principia recomenda",
  title = "Esta questão não termina no gabarito.",
  subtitle = "Revise o conceito, compare caminhos de resolução e treine outras questões do mesmo assunto para consolidar o raciocínio.",
  cta = "Continuar estudando",
  className = "",
}: PrincipiaQuestionBannerProps) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#050B1C] text-white shadow-2xl",
        "ring-1 ring-[#0E00D0]/20",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-[280px] w-[280px] rounded-full bg-[#0E00D0]/35 blur-[90px]" />
        <div className="absolute bottom-[-140px] right-[-90px] h-[300px] w-[300px] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute right-[25%] top-[-80px] h-[180px] w-[180px] rounded-full bg-[#D5A900]/10 blur-[70px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.075)_1px,transparent_1px)] [background-size:26px_26px] opacity-20" />

        <Sigma className="absolute left-[6%] top-[18%] h-14 w-14 text-white/[0.035]" />
        <FunctionSquare className="absolute bottom-[14%] left-[30%] h-12 w-12 rotate-6 text-blue-300/[0.06]" />
        <Compass className="absolute right-[8%] top-[12%] h-16 w-16 rotate-12 text-yellow-300/[0.055]" />
      </div>

      <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_250px] lg:items-center lg:p-7">
        <div className="min-w-0">


          <h2 className="max-w-2xl text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
            {title}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {subtitle}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0E00D0] px-5 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(14,0,208,0.35)] transition hover:bg-blue-700 active:scale-[0.99]"
            >
              <BookOpen className="h-4 w-4" />
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="text-xs font-semibold text-slate-400">
              Sem atalhos: conceito, método e repetição.
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[240px] items-center justify-center lg:max-w-none">
          <div className="absolute h-40 w-40 rounded-full bg-[#0E00D0]/20 blur-[55px]" />

          <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.045] p-3 shadow-2xl backdrop-blur-sm">
            <PrincipiaOrbitSpinner className="h-40 w-40 sm:h-44 sm:w-44 lg:h-48 lg:w-48" />
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-white/[0.035] px-5 py-3 sm:px-6 lg:px-7">
        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Principia Matemática.</span>
          <span className="text-slate-500">
            Álgebra • Funções • Geometria • Razão e Proporção
          </span>
        </div>
      </div>
    </section>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  LifeBuoy,
  RefreshCcw,
  Compass,
  Sigma,
  FunctionSquare,
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
            id="principia-orbit-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#0E00D0" />
            <stop offset="48%" stopColor="#4DA1FF" />
            <stop offset="100%" stopColor="#D5A900" />
          </linearGradient>

          <filter id="principia-glow">
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
            stroke="url(#principia-orbit-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="72 320"
            filter="url(#principia-glow)"
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
            stroke="url(#principia-orbit-gradient)"
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

function InstagramIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10zm-5 3.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 7.3A2.8 2.8 0 1 1 14.8 12 2.8 2.8 0 0 1 12 14.8zm4.8-8.6a1 1 0 1 1-1-1 1 1 0 0 1 1 1z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.01 3.01 0 0 0-2.112-2.133C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.386.553A3.01 3.01 0 0 0 .502 6.186 31.36 31.36 0 0 0 0 12a31.36 31.36 0 0 0 .502 5.814 3.01 3.01 0 0 0 2.112 2.133C4.495 20.5 12 20.5 12 20.5s7.505 0 9.386-.553a3.01 3.01 0 0 0 2.112-2.133A31.36 31.36 0 0 0 24 12a31.36 31.36 0 0 0-.502-5.814ZM9.75 15.568V8.432L15.818 12 9.75 15.568Z" />
    </svg>
  );
}

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#00091A] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#0E00D0]/20 blur-[150px]" />
        <div className="absolute bottom-[-180px] right-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[140px]" />
        <div className="absolute left-[-160px] top-[36%] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:30px_30px] opacity-15" />

        <Sigma className="absolute left-[7%] top-[24%] h-20 w-20 text-white/[0.035]" />
        <FunctionSquare className="absolute right-[9%] top-[18%] h-16 w-16 text-blue-300/[0.06]" />
        <Compass className="absolute bottom-[18%] left-[11%] h-20 w-20 rotate-12 text-yellow-300/[0.055]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <img
              src="/logo-principia-white.png"
              alt="Logo"
              className="h-10 w-auto sm:h-12"
            />
          </Link>

          <a
            href="https://wa.me/5531996745835"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/[0.08] hover:text-gray-300 sm:px-4 sm:text-sm"
          >
            <LifeBuoy className="h-4 w-4" />
            Suporte
          </a>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:py-10">
          <div className="order-2 lg:order-1">
            

            <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Esta equação saiu do domínio.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              O endereço acessado não existe, foi movido ou está incompleto.
              Podemos recalcular a rota e voltar para um ponto seguro da
              plataforma.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/[0.1] active:scale-[0.99]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>

              <Link
                href="/home"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0E00D0] px-5 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(14,0,208,0.35)] transition hover:bg-blue-700 active:scale-[0.99]"
              >
                <Home className="h-4 w-4" />
                Ir para a home
              </Link>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08] active:scale-[0.99]"
              >
                <RefreshCcw className="h-4 w-4" />
                Recarregar
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-center gap-4">
                <PrincipiaOrbitSpinner className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />

                <div>
                  <p className="text-sm font-bold text-white">
                    Procurando uma rota válida...
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
                    Se você chegou aqui por um link antigo, use os botões acima
                    para retornar ao conteúdo correto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-[640px]">
              <div className="absolute inset-8 rounded-full bg-blue-500/10 blur-[90px]" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] p-3 shadow-2xl backdrop-blur-sm sm:p-4">
                <img
                  src="/404-error.png"
                  alt="Alunos tentando resolver uma equação em uma página não encontrada"
                  className="h-auto w-full rounded-[1.45rem] object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-5 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <ul className="space-y-3 sm:flex sm:items-center sm:space-y-0 sm:gap-5">
              <li>
                <a
                  href="https://www.instagram.com/principia_matematica/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center text-white transition-colors hover:text-gray-300"
                >
                  <span className="mr-3 inline-flex h-5 w-5 items-center justify-center">
                    <InstagramIcon />
                  </span>
                  <span>@principia_matematica</span>
                </a>
              </li>

              <li>
                <a
                  href="https://www.youtube.com/@principia_matematica"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center text-white transition-colors hover:text-gray-300"
                >
                  <span className="mr-3 inline-flex h-5 w-5 items-center justify-center">
                    <YouTubeIcon />
                  </span>
                  <span>Principia Matemática</span>
                </a>
              </li>
            </ul>
          </div>

          <a
            href="https://wa.me/5531996745835"
            target="_blank"
            rel="noreferrer"
            className="block text-sm font-bold text-white transition-colors hover:text-gray-300"
          >
            Suporte
          </a>
        </footer>
      </div>
    </main>
  );
}
"use client";

import { useEffect } from "react";

export default function TransitionLoader({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500); // Duração da animação

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]">
      <div className="relative w-[300px] h-[300px]">
        <div className="absolute inset-0 rounded-full border-4 border-t-[#888] border-transparent animate-spin-slow"></div>

        <svg className="absolute top-1/2 left-1/2 w-[200px] h-[200px] -translate-x-1/2 -translate-y-1/2" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M213 2626 l-28 -24 24 -49 c12 -26 47 -88 76 -138 29 -49 63 -108 75 -130 81 -146 145 -247 163 -260 18 -13 106 -15 614 -15 325 0 594 -3 596 -7 3 -5 -54 -110 -126 -235 l-132 -228 -295 0 c-251 0 -299 -2 -318 -16 -45 -31 -60 0 401 -799 214 -370 225 -384 270 -343 13 13 57 79 97 148 40 69 96 166 125 215 30 50 66 114 81 143 l27 53 -21 45 c-12 24 -56 104 -99 177 -111 191 -163 284 -163 291 0 3 125 6 278 6 233 0 281 2 299 15 20 14 82 113 158 250 15 28 31 55 35 60 4 6 19 30 32 55 14 25 48 85 77 134 28 49 51 91 51 94 0 3 6 13 14 21 8 9 27 41 44 71 16 30 71 126 122 213 121 208 125 219 101 249 l-19 23 -1266 2 -1265 3 -28 -24z"
            transform="translate(0,300) scale(0.1,-0.1)"
            className="stroke-[#aaa] fill-none stroke-[2] animate-draw"
          />
        </svg>
      </div>
    </div>
  );
}
//components/editor/ImageLightbox.tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  const lightboxRef = useRef<HTMLDivElement>(null);

  // ✅ Fechar com ESC + travar scroll do body
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Verificar se o clique foi fora do lightbox
    const handleClickOutside = (e: MouseEvent) => {
      if (lightboxRef.current && !lightboxRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* ✅ Imagem com clique isolado */}
      <img
        src={imageUrl}
        alt="Visualização ampliada"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* ✅ Botão de fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 cursor-pointer bg-black/60 rounded-full p-2 border border-white/20 transition-all hover:scale-110 z-50"
        aria-label="Fechar"
      >
        <X size={32} />
      </button>
    </div>
  );
};
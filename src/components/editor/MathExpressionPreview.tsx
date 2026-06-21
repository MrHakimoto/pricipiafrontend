// components/editor/MathExpressionPreview.tsx
"use client";

import React, { useEffect, useRef } from "react";
import katex from "katex";
// import "katex/dist/katex.min.css";

// ✅ Tipagem da função utilitária
const fixMathrmClasses = (html: string): string => {
  return html
    .replace(/class="mord mathnormal"/g, 'class="mord mathrm"')
    .replace(/class="([^"]*?)mathnormal([^"]*?)"/g, 'class="$1mathrm$2"')
    .replace(/class="([^"]*?)mathit([^"]*?)"/g, 'class="$1mathrm$2"');
};

// ✅ Tipagem das props do preview
export interface MathExpressionPreviewProps {
  latex: string;
  size?: "small" | "normal" | "large";
  inline?: boolean;
}

function getFontSize(size: MathExpressionPreviewProps["size"]) {
  switch (size) {
    case "small":
      return "0.78rem";
    case "large":
      return "1.08rem";
    default:
      return "0.9rem";
  }
}

export const MathExpressionPreview: React.FC<MathExpressionPreviewProps> = ({
  latex,
  size = "normal",
  inline = false,
}) => {
  const containerRef = useRef<HTMLSpanElement | HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: !inline,
          strict: false,
          fleqn: false,
          output: "html",
        });

        const correctedHTML = fixMathrmClasses(html);
        containerRef.current.innerHTML = correctedHTML;
      } catch (error) {
        console.error("Erro ao renderizar KaTeX:", error);

        containerRef.current.innerHTML = `
          <span class="math-preview-error">${latex}</span>
        `;
      }
    }
  }, [latex, inline]);

  if (!latex) return null;

  const className = [
    "math-preview max-w-full overflow-x-auto overflow-y-hidden",
    inline ? "inline-block align-middle" : "block",
    "[&_.katex]:max-w-full [&_.katex]:text-inherit",
    "[&_.katex-display]:my-0 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden",
    "[&_.math-preview-error]:text-xs [&_.math-preview-error]:font-semibold [&_.math-preview-error]:text-red-600 dark:[&_.math-preview-error]:text-red-300",
  ].join(" ");

  const style: React.CSSProperties = {
    fontSize: getFontSize(size),
    lineHeight: "1.25rem",
  };

  if (inline) {
    return (
      <span
        ref={containerRef as React.Ref<HTMLSpanElement>}
        className={className}
        style={style}
      />
    );
  }

  return (
    <div
      ref={containerRef as React.Ref<HTMLDivElement>}
      className={className}
      style={style}
    />
  );
};

// ✅ Tipagem das props do botão
export interface MathExpressionButtonProps {
  title: string;
  latex: string;
  onClick: () => void;
  size?: "small" | "normal" | "large";
}

export const MathExpressionButton: React.FC<MathExpressionButtonProps> = ({
  title,
  latex,
  onClick,
  size = "normal",
}) => {
  return (
    <button
      type="button"
      className={[
        "group relative flex min-h-11 w-full min-w-0 items-center justify-center overflow-hidden rounded-xl border px-3 py-2",
        "border-slate-200 bg-white text-slate-800 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0E00D0]/40 hover:bg-blue-50 hover:text-[#0E00D0] hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E00D0]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "active:translate-y-0 active:scale-[0.98]",
        "dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-100 dark:shadow-none",
        "dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-100",
        "dark:focus-visible:ring-blue-400/40 dark:focus-visible:ring-offset-[#020617]",
      ].join(" ")}
      title={title}
      onClick={onClick}
    >
      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#0E00D0]/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-blue-300/40" />

      <span
        className={[
          "wmde-markdown wmde-markdown-color pointer-events-none inline-flex w-full min-w-0 items-center justify-center rounded-md text-center text-sm",
          "text-slate-800 dark:text-slate-100",
          "[&_code]:bg-transparent [&_code]:px-0",
          "[&_ul]:list-disc [&_ol]:list-[upper-roman] [&_.mord]:!mr-0",
          "[&_.katex]:text-inherit",
        ].join(" ")}
        style={
          {
            "--color-canvas-default": "transparent",
            "--color-fg-default": "currentColor",
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
          } as React.CSSProperties
        }
      >
        <span className="inline-flex max-w-full items-center justify-center overflow-x-auto rounded-md bg-transparent px-1 py-0.5">
          <MathExpressionPreview latex={latex} size={size} inline />
        </span>
      </span>
    </button>
  );
};

export default MathExpressionPreview;
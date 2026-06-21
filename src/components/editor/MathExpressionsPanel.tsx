// components/editor/MathExpressionsPanel.tsx
"use client";

import React, { Suspense, lazy } from "react";
import { CircleHelp, Code, Braces } from "lucide-react";

// ✅ Tipagem do componente carregado dinamicamente
const MathExpressionPreview = lazy<
  React.ComponentType<{ latex: string; inline?: boolean }>
>(() => import("./MathExpressionPreview"));

// ✅ Tipagem das expressões
interface MathExpression {
  title: string;
  latex: string;
  insert: string;
  after?: string;
}

// ✅ Tipagem das props do painel
interface MathExpressionsPanelProps {
  onClose?: () => void;
  onInsert: (before: string, after: string) => void;
}

const MathExpressionsPanel: React.FC<MathExpressionsPanelProps> = ({
  onClose,
  onInsert,
}) => {
  const expressions: MathExpression[] = [
    { title: "Fração", latex: "\\frac{x}{y}", insert: "\\frac{", after: "}{ }" },
    { title: "Vetor", latex: "\\vec{x}", insert: "\\vec{", after: "}" },
    {
      title: "Raiz quadrada",
      latex: "\\sqrt{x}",
      insert: "\\sqrt{",
      after: "}",
    },
    {
      title: "Raiz cúbica",
      latex: "\\sqrt[3]{x}",
      insert: "\\sqrt[3]{",
      after: "}",
    },
    { title: "Exponencial", latex: "x^y", insert: "^{", after: "}" },
    {
      title: "Logaritmo",
      latex: "\\log_{y}{(x)}",
      insert: "\\log_{",
      after: "}{()}",
    },
  ];

  // ✅ Tipagem do handler
  const handleExpressionClick = (expression: MathExpression) => {
    onInsert(`\`$$${expression.insert}`, `${expression.after || "}"}$$\``);
    onClose?.();
  };

  const insertInlineEquation = (): void => {
    onInsert("`$$", "$$`");
    onClose?.();
  };

  const insertBlockEquation = (): void => {
    onInsert("```KaTeX\n\n```", "");
    onClose?.();
  };

  return (
    <div
      className={[
        "z-50 flex w-[min(calc(100vw-2rem),430px)] max-w-full flex-col gap-4 rounded-2xl border p-3 shadow-2xl outline-none sm:p-4",
        "border-slate-200 bg-white text-slate-950",
        "dark:border-white/10 dark:bg-[#08111F] dark:text-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
            Expressões matemáticas
          </h5>

          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Clique em uma estrutura para inserir no editor.
          </p>
        </div>

        <a
          className={[
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all",
            "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#0E00D0]/30 hover:bg-blue-50 hover:text-[#0E00D0]",
            "dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-100",
          ].join(" ")}
          aria-label="Ajuda"
          title="Ajuda"
          target="_blank"
          href="https://katex.org/docs/supported"
          rel="noopener noreferrer"
        >
          <CircleHelp className="h-4 w-4 shrink-0" />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {expressions.map((expr, index) => (
          <button
            key={index}
            type="button"
            className={[
              "group relative flex min-h-[4.25rem] min-w-0 items-center justify-center overflow-hidden rounded-xl border px-2 py-2 transition-all duration-200",
              "border-slate-200 bg-slate-50 text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-[#0E00D0]/35 hover:bg-blue-50 hover:text-[#0E00D0] hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E00D0]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              "active:translate-y-0 active:scale-[0.98]",
              "dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-100 dark:shadow-none dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-100",
              "dark:focus-visible:ring-blue-400/40 dark:focus-visible:ring-offset-[#08111F]",
            ].join(" ")}
            title={expr.title}
            onClick={() => handleExpressionClick(expr)}
          >
            <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#0E00D0]/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-blue-300/40" />

            <div
              className={[
                "wmde-markdown wmde-markdown-color pointer-events-none w-full min-w-0 rounded-md text-center text-sm",
                "text-slate-800 dark:text-slate-100",
                "[&_p]:m-0 [&_code]:bg-transparent [&_code]:px-0",
                "[&_.katex]:text-inherit [&_.katex]:max-w-full",
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
              <p>
                <code
                  className="inline-flex max-w-full items-center justify-center overflow-x-auto rounded-md bg-transparent px-1 py-0.5"
                  style={{ background: "transparent" }}
                >
                  <Suspense
                    fallback={
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {expr.latex}
                      </span>
                    }
                  >
                    <MathExpressionPreview latex={expr.latex} inline />
                  </Suspense>
                </code>
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-slate-200 pt-3 sm:grid-cols-2 dark:border-white/10">
        <button
          type="button"
          className={[
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all",
            "border-slate-200 bg-white text-slate-700 hover:border-[#0E00D0]/30 hover:bg-blue-50 hover:text-[#0E00D0]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E00D0]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            "dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-100",
            "dark:focus-visible:ring-blue-400/40 dark:focus-visible:ring-offset-[#08111F]",
          ].join(" ")}
          onClick={insertInlineEquation}
        >
          <Code className="h-3.5 w-3.5 shrink-0" />
          Equação em linha
        </button>

        <button
          type="button"
          className={[
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all",
            "border-slate-200 bg-white text-slate-700 hover:border-[#0E00D0]/30 hover:bg-blue-50 hover:text-[#0E00D0]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E00D0]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            "dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-100",
            "dark:focus-visible:ring-blue-400/40 dark:focus-visible:ring-offset-[#08111F]",
          ].join(" ")}
          onClick={insertBlockEquation}
        >
          <Braces className="h-3.5 w-3.5 shrink-0" />
          Equação em bloco
        </button>
      </div>
    </div>
  );
};

export default MathExpressionsPanel;
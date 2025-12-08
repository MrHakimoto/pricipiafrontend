// components/editor/MathExpressionsPanel.tsx
'use client';

import React, { Suspense, lazy } from 'react';
import { CircleHelp, Code, Braces } from "lucide-react";

// ✅ Tipagem do componente carregado dinamicamente
const MathExpressionPreview = lazy<
  React.ComponentType<{ latex: string; inline?: boolean }>
>(() => import('./MathExpressionPreview'));

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
  onInsert
}) => {
  const expressions: MathExpression[] = [
    { title: "Fração", latex: "\\frac{x}{y}", insert: "\\frac{", after: "}{ }" },
    { title: "Vetor", latex: "\\vec{x}", insert: "\\vec{", after: "}" },
    { title: "Raíz quadrada", latex: "\\sqrt{x}", insert: "\\sqrt{", after: "}" },
    { title: "Raíz cúbica", latex: "\\sqrt[3]{x}", insert: "\\sqrt[3]{", after: "}" },
    { title: "Exponencial", latex: "x^y", insert: "^{", after: "}" },
    { title: "Logaritmo", latex: "\\log_{y}{(x)}", insert: "\\log_{", after: "}{()}" },
  ];

  // ✅ Tipagem do handler
  const handleExpressionClick = (expression: MathExpression) => {
    onInsert(
      `\`$$${expression.insert}`,
      `${expression.after || '}'}$$\``
    );
    onClose?.();
  };

  const insertInlineEquation = (): void => {
    onInsert('`$$', '$$`');
    onClose?.();
  };

  const insertBlockEquation = (): void => {
    onInsert('```KaTeX\n\n```', '');
    onClose?.();
  };

  return (
    <div className="z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none flex flex-col gap-3 w-[400px]">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-lg">Expressões matemáticas</h5>
        <a
          className="inline-flex items-center justify-center rounded-md font-medium transition-all hover:bg-accent hover:text-accent-foreground size-8 p-1 text-xs"
          aria-label="Ajuda"
          title="Ajuda"
          target="_blank"
          href="https://katex.org/docs/supported"
          rel="noopener noreferrer"
        >
          <CircleHelp className="shrink-0 w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {expressions.map((expr, index) => (
          <button
            key={index}
            type="button"
            className="border rounded-sm px-2 py-1.5 hover:opacity-70 transition-all hover:bg-accent hover:text-accent-foreground"
            title={expr.title}
            onClick={() => handleExpressionClick(expr)}
          >
            <div
              className="wmde-markdown wmde-markdown-color w-full text-sm rounded-md placeholder:text-muted-foreground/50 pointer-events-none"
              style={{
                '--color-canvas-default': 'rgb(var(--transparent))',
                '--color-fg-default': 'rgb(var(--foreground))',
                fontSize: '0.875rem',
                lineHeight: '1.25rem'
              } as React.CSSProperties}
            >
              <p>
                <code style={{ background: 'transparent', padding: '0px 2px' }}>
                  <Suspense fallback={<span>{expr.latex}</span>}>
                    <MathExpressionPreview latex={expr.latex} inline />
                  </Suspense>
                </code>
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 flex-wrap pt-3 border-t">
        <button
          type="button"
          className="inline-flex items-center justify-center font-medium transition-all gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 rounded-md px-3 text-sm flex-1"
          onClick={insertInlineEquation}
        >
          <Code className="shrink-0 w-3.5 h-3.5" />
          Equação em linha
        </button>

        <button
          type="button"
          className="inline-flex items-center justify-center font-medium transition-all gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 rounded-md px-3 text-sm flex-1"
          onClick={insertBlockEquation}
        >
          <Braces className="shrink-0 w-3.5 h-3.5" />
          Equação em bloco
        </button>
      </div>
    </div>
  );
};

export default MathExpressionsPanel;

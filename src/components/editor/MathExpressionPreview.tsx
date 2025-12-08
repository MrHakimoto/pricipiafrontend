// components/editor/MathExpressionPreview.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
  size?: 'small' | 'normal' | 'large';
  inline?: boolean;
}

export const MathExpressionPreview: React.FC<MathExpressionPreviewProps> = ({ 
  latex, 
  size = 'normal',
  inline = false 
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: !inline,
          strict: false,
          fleqn: false,
          output: 'html'
        });

        const correctedHTML = fixMathrmClasses(html);
        containerRef.current.innerHTML = correctedHTML;
      } catch (error) {
        console.error('Erro ao renderizar KaTeX:', error);
        containerRef.current.innerHTML = `
          <span style="color: red; font-size: 0.8em;">${latex}</span>
        `;
      }
    }
  }, [latex, inline]);

  if (!latex) return null;

  return (
    <div 
      ref={containerRef}
      className={`math-preview ${inline ? 'inline-block' : 'block'}`}
      style={{
        fontSize:
          size === 'small'
            ? '0.75rem'
            : size === 'large'
            ? '1.1rem'
            : '0.875rem',
        lineHeight: '1.25rem'
      }}
    />
  );
};

// ✅ Tipagem das props do botão
export interface MathExpressionButtonProps {
  title: string;
  latex: string;
  onClick: () => void;
  size?: 'small' | 'normal' | 'large';
}

export const MathExpressionButton: React.FC<MathExpressionButtonProps> = ({ 
  title, 
  latex, 
  onClick, 
  size = 'normal' 
}) => {
  return (
    <button
      type="button"
      className="border rounded-sm px-2 py-1.5 hover:opacity-70 transition-all hover:bg-accent hover:text-accent-foreground"
      title={title}
      onClick={onClick}
    >
      <div
        className="wmde-markdown wmde-markdown-color w-full text-sm rounded-md placeholder:text-muted-foreground/50 [&_ul]:list-disc [&_ol]:list-[upper-roman] [&_.mord]:!mr-0 pointer-events-none"
        style={{
          '--color-canvas-default': 'rgb(var(--transparent))',
          '--color-fg-default': 'rgb(var(--foreground))',
          fontSize: '0.875rem',
          lineHeight: '1.25rem'
        } as React.CSSProperties}
      >
        <p>
          <code style={{ background: 'transparent', padding: '0px 2px' }}>
            <MathExpressionPreview latex={latex} size={size} inline />
          </code>
        </p>
      </div>
    </button>
  );
};

export default MathExpressionPreview;

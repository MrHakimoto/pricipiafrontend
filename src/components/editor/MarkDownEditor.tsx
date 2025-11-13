"use client";

import React, { useState, useRef, useEffect, ReactElement, cloneElement, CSSProperties, ReactNode } from "react";
import ReactMarkdown from "react-markdown";

// --- Plugins e Estilos para o Preview ---
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css"; // Essencial para as fórmulas!
import { BlockMath, InlineMath } from 'react-katex';
import ImageEditorModal from '@/components/editor/ImageEditorModal';

// --- Ícones da Toolbar ---
import {
  Bold, Italic, Strikethrough, Subscript, Superscript, Link as LinkIcon, ImagePlus,
  Eye, PencilLine, Sigma, Pi, CircleHelp, X
} from "lucide-react";

// --- Biblioteca de Posicionamento para Popovers ---
import {
  useFloating, autoUpdate, offset, flip, shift, useClick, useDismiss, useRole, useInteractions, FloatingFocusManager, FloatingPortal,
} from '@floating-ui/react';

// ====================================================================
// 1. INTERFACES E TIPOS
// ====================================================================

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PopoverProps {
  trigger: ReactElement;
  content: ReactElement<{ onClose?: () => void }>;
}

interface MathExpressionsPanelProps {
  onClose: () => void;
  onInsert: (before: string, after?: string) => void;
}

interface SymbolsPanelProps {
  onClose: () => void;
  onInsert: (text: string) => void;
}

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  editorStyle?: CSSProperties;
  containerClassName?: string;
}

interface ExpressionButton {
  label: string;
  math: string;
  insert: [string, string?];
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: ReactNode; // ✅ Tornar children opcional
  [key: string]: any;
}

interface ImageProps {
  src?: string;
  alt?: string;
  node?: any;
  [key: string]: any;
}

// Interface para as props padrão do ReactMarkdown
interface ReactMarkdownProps {
  node?: any;
  children?: ReactNode;
  [key: string]: any;
}

// ====================================================================
// 2. COMPONENTES DE UI REUTILIZÁVEIS (BOTÕES E POPOVER)
// ====================================================================

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, label, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`cursor-pointer flex flex-row items-center gap-1.5 px-3 text-xs h-[calc(100%+1px)] rounded-t-md font-medium transition-colors
      ${isActive
        ? 'bg-[#00091A] cursor-pointer border-b-0 text-white border-r border-l border-t border-gray-700'
        : 'bg-transparent text-gray-400 hover:bg-gray-700/50'
      }
    `}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden sm:block">{label}</span>
  </button>
);

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, title, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="h-7 w-7 flex items-center justify-center rounded-md text-gray-300 hover:bg-gray-700/80 transition-colors"
  >
    <Icon className="w-4 h-4" />
  </button>
);

const Popover: React.FC<PopoverProps> = ({ trigger, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), flip(), shift({ padding: 10 })],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  // Correção: Adicionar tipo para as props do elemento clonado
  const contentWithClose = cloneElement(content, { 
    onClose: () => setIsOpen(false) 
  } as { onClose: () => void });

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {trigger}
      </div>
      <FloatingPortal>
        {isOpen && (
          <FloatingFocusManager context={context} modal={false}>
            <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()} className="z-50">
              {contentWithClose}
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </>
  );
};

// ====================================================================
// 3. PAINÉIS DE CONTEÚDO PARA OS POPOVERS (COM CORREÇÕES)
// ====================================================================

const MathExpressionsPanel: React.FC<MathExpressionsPanelProps> = ({ onClose, onInsert }) => {
  const expressionButtons: ExpressionButton[] = [
    { label: 'Fração', math: '\\frac{x}{y}', insert: ['$$\\frac{', '}{}$$'] },
    { label: 'Vetor', math: '\\vec{x}', insert: ['$$\\vec{', '}$$'] },
    { label: 'Raiz Quadrada', math: '\\sqrt{x}', insert: ['$$\\sqrt{', '}$$'] },
    { label: 'Raiz Cúbica', math: '\\sqrt[3]{x}', insert: ['$$\\sqrt[3]{', '}$$'] },
    { label: 'Potência', math: 'x^y', insert: ['$$^{', '}$$'] },
    { label: 'Logaritmo', math: '\\log_y(x)', insert: ['$$\\log_{', '}({})$$'] },
    { label: 'Sistema', math: '\\begin{cases} x=1 \\\\ y=2 \\end{cases}', insert: ['\\begin{cases}\n', '\n\\end{cases}'] },
  ];
  
  return (
    <div className="bg-[#1e1e1e] rounded-lg shadow-xl w-96 border border-gray-700" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Expressões</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="p-3 grid grid-cols-4 gap-2 border-b border-gray-700">
        {expressionButtons.map((btn, index) => (
          <button 
            key={index} 
            onClick={() => { 
              onInsert(btn.insert[0], btn.insert[1] || ''); 
              onClose(); 
            }} 
            className="bg-gray-800 text-white p-3 rounded-md hover:bg-gray-700 flex items-center justify-center text-base h-14"
          >
            <InlineMath math={btn.math} />
          </button>
        ))}
      </div>
      <div className="p-3 flex gap-3">
        <button 
          onClick={() => { onInsert('$$', '$$'); onClose(); }} 
          className="flex-1 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-md"
        >
          &lt;&gt; Em linha
        </button>
        <button 
          onClick={() => { onInsert('```katex\n', '\n```'); onClose(); }} 
          className="flex-1 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-md"
        >
          {`{}`} Em bloco
        </button>
      </div>
    </div>
  );
};

const SymbolsPanel: React.FC<SymbolsPanelProps> = ({ onClose, onInsert }) => {
  const symbols = [
    '\\alpha', '\\beta', '\\gamma', '\\delta', '\\theta', '\\lambda', '\\mu', '\\pi', '\\rho', 
    '\\sigma', '\\tau', '\\phi', '\\psi', '\\omega', '\\Sigma', '\\Delta', '\\Phi', '\\Psi', 
    '\\Omega', '\\approx', '\\pm', '\\infty', '\\neq', '\\le', '\\ge', '\\times', '\\cdot', 
    '\\div', '\\int', '\\sum', '\\prod'
  ];
  
  return (
    <div className="#bg-[#00091A] rounded-lg shadow-xl w-full max-w-sm border border-gray-700" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Símbolos</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="p-3 grid grid-cols-8 gap-1">
        {symbols.map((symbol, index) => (
          <button 
            key={index} 
            onClick={() => { onInsert(`$$${symbol}$$`); onClose(); }} 
            className="bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center justify-center text-lg h-11 w-11"
          >
            <InlineMath math={symbol} />
          </button>
        ))}
      </div>
    </div>
  );
};

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  return (
    <FloatingPortal>
      <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <img 
          src={imageUrl} 
          alt="Visualização ampliada" 
          className="max-w-[90vw] max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          aria-label="Fechar"
        >
          <X size={32} />
        </button>
      </div>
    </FloatingPortal>
  );
};

// ====================================================================
// 4. COMPONENTE PRINCIPAL DO EDITOR
// ====================================================================

export default function MarkdownEditor({ 
  initialContent, 
  onChange, 
  editorStyle = {}, 
  containerClassName = "" 
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [content, setContent] = useState(initialContent || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const insertAtCursor = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    let start: number, end: number;

    if (document.activeElement === textarea) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
    } else {
      start = content.length;
      end = content.length;
    }

    const selected = content.substring(start, end);
    const newText = content.substring(0, start) + before + selected + after + content.substring(end);
    
    setContent(newText);

    textarea.focus();
    setTimeout(() => {
      const newPosition = start + before.length + selected.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditingImage(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadEditedImage = async (file: File) => {
    setEditingImage(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Falha no upload.');

      if (result.url) {
        insertAtCursor("![", `](${result.url})`);
      }
    } catch (error) {
      console.error(error);
      // Correção: Tratamento adequado do tipo unknown
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Ocorreu um erro: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-md border border-gray-700 bg-[#00091A] shadow text-white ${containerClassName}`}>
      {/* Toolbar (mesmo código anterior) */}
      
      {/* Área do editor / preview */}
      {mode === "edit" ? (
        <textarea 
          style={editorStyle} 
          ref={textareaRef} 
          id="md-editor" 
          className="w-full h-96 p-4 bg-[#00091A] text-gray-200 font-mono text-sm outline-none resize-y" 
          value={content} 
          onChange={handleChange} 
        />
      ) : (
        <div style={editorStyle} className="prose prose-invert max-w-none p-4 min-h-[20px]">
          <ReactMarkdown
            children={content}
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              // ✅ Correção: Usar props padrão do ReactMarkdown e fazer type assertion
              code: (props: ReactMarkdownProps) => {
                const { node, className, children, ...rest } = props;
                const inline = props.inline as boolean | undefined;
                
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                if (language.toLowerCase() === 'katex' && !inline) { 
                  return <BlockMath math={String(children).replace(/\n$/, '')} />; 
                }
                
                return !inline ? (
                  <pre className="bg-gray-800 rounded-md p-3">
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-700 rounded-sm px-1 py-0.5 text-sm" {...rest}>
                    {children}
                  </code>
                );
              },
              // ✅ Correção: Converter src para string se for Blob
              img: (props: ReactMarkdownProps) => {
                const { node, ...rest } = props;
                
                // Converter src para string se for Blob
                const src = rest.src instanceof Blob ? URL.createObjectURL(rest.src) : rest.src;
                
                return (
                  <img 
                    {...rest}
                    src={src}
                    className="cursor-pointer transition-transform hover:scale-105" 
                    onClick={() => setZoomedImageUrl(src || null)} 
                    alt={rest.alt || ""}
                  />
                );
              },
            }}
          />
        </div>
      )}
      {zoomedImageUrl && (
        <ImageLightbox imageUrl={zoomedImageUrl} onClose={() => setZoomedImageUrl(null)} />
      )}
    </div>
  );
}

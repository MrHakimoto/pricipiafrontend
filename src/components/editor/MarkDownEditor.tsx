// components/editor/MarkdownEditor.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef, MouseEvent, KeyboardEvent, ChangeEvent, DragEvent, ReactElement, ReactNode } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap } from "@codemirror/commands";
import { EditorView, keymap, ViewUpdate } from "@codemirror/view";
import { languages } from "@codemirror/language-data";
import { mathStructurePlugin } from "./mathStructurePlugin";
import { processMarkdown } from "../../utils/markdownProcessor";

// Importar tipos do Lucide
import type { LucideIcon } from "lucide-react";
// Ícones
import {
  Bold, Italic, Subscript, Superscript, Link as LinkIcon,
  ImagePlus, Eye, PencilLine, Sigma, Pi, X
} from "lucide-react";

// Importações dinâmicas para evitar problemas de SSR
import dynamic from 'next/dynamic';

// Componentes dinâmicos
const MathExpressionsPanel = dynamic(() => import('./MathExpressionsPanel'), {
  ssr: false,
  loading: () => <div>Carregando...</div>
});

const ImageEditorModal = dynamic(() => import('../editor/ImageEditorModal'), {
  ssr: false
});

// ========== INTERFACES E TIPOS ==========

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon: LucideIcon;
}

interface ActionButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  title: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface PopoverProps {
  trigger: ReactNode;
  children: ReactElement<{ onClose?: () => void }>;
  onClose?: () => void;
}

interface SymbolsPanelProps {
  onClose?: () => void;
  onInsert: (symbol: string) => void;
}

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

interface Symbol {
  symbol: string;
  title: string;
}

interface CustomKeymap {
  key: string;
  mac?: string;
  run: (view: EditorView) => boolean;
}

// ========== COMPONENTES AUXILIARES ==========

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, label, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isActive}
    data-state={isActive ? "on" : "off"}
    className={`cursor-pointer
      relative inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black
      transition-all duration-200 outline-none
      focus-visible:ring-2 focus-visible:ring-[#0E00D0]/40
      sm:px-4

      ${isActive
        ? `
          border border-[#0E00D0]/40
          bg-[#0E00D0]
          text-white
          shadow-md shadow-[#0E00D0]/15
        `
        : `
          border border-transparent
          bg-transparent
          text-slate-600
          hover:border-slate-200
          hover:bg-white
          hover:text-slate-950
          dark:text-slate-300
          dark:hover:border-white/10
          dark:hover:bg-white/10
          dark:hover:text-white
        `
      }
    `}
    aria-label={label}
  >
    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
    <span className="hidden sm:block">{label}</span>
  </button>
);

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, title, icon: Icon, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-transparent p-1 text-xs font-medium text-slate-600 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E00D0]/30 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white sm:h-8 sm:w-8"
    aria-label={title}
  >
    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
  </button>
);

const VisibleActionButton: React.FC<Omit<ActionButtonProps, 'disabled'>> = ({ onClick, title, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="flex h-9 w-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-medium text-slate-600 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E00D0]/30 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white sm:h-8 sm:w-8 [&>svg]:h-4 [&>svg]:w-4"
    aria-label={title}
  >
    <Icon aria-hidden="true" className="w-4 h-4" />
  </button>
);

const HiddenActionButton: React.FC<Omit<ActionButtonProps, 'disabled'>> = ({ onClick, title, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="hidden h-8 w-8 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-medium text-slate-600 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E00D0]/30 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white sm:flex [&>svg]:h-4 [&>svg]:w-4"
    aria-label={title}
  >
    <Icon aria-hidden="true" className="w-4 h-4" />
  </button>
);

// ========== POPOVER COMPONENT ==========
const Popover: React.FC<PopoverProps> = ({ trigger, children, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  }>({
    top: 0,
    left: 0,
    maxHeight: 520,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const closePopover = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = Math.min(430, window.innerWidth - 24);
    const safeLeft = Math.min(
      Math.max(12, rect.left),
      Math.max(12, window.innerWidth - panelWidth - 12),
    );

    const gap = 8;
    const safePadding = 12;
    const spaceBelow = window.innerHeight - rect.bottom - safePadding;
    const spaceAbove = rect.top - safePadding;
    const shouldOpenUp = spaceBelow < 360 && spaceAbove > spaceBelow;
    const availableSpace = shouldOpenUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(240, Math.min(520, availableSpace - gap));

    setCoords({
      top: shouldOpenUp
        ? Math.max(safePadding, rect.top - maxHeight - gap)
        : Math.min(rect.bottom + gap, window.innerHeight - safePadding),
      left: safeLeft,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closePopover();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside as any);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as any);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, closePopover, updatePosition]);

  const toggle = () => {
    if (!triggerRef.current) return;

    if (!isOpen) {
      updatePosition();
    }

    setIsOpen(prev => !prev);
  };

  return (
    <>
      <div ref={triggerRef} onClick={toggle} className="inline-flex cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            maxHeight: coords.maxHeight,
            zIndex: 999999,
          }}
          className="w-[calc(100vw-24px)] max-w-[430px] overflow-y-auto overflow-x-hidden rounded-2xl"
        >
          {React.cloneElement(children, { onClose: closePopover })}
        </div>
      )}
    </>
  );
};


// ========== SYMBOLS PANEL ==========
const SymbolsPanel: React.FC<SymbolsPanelProps> = ({ onClose, onInsert }) => {
  const symbolGroups: Array<{ title: string; items: Symbol[] }> = [
    {
      title: "Gregas",
      items: [
        { symbol: "α", title: "alpha" },
        { symbol: "β", title: "beta" },
        { symbol: "γ", title: "gamma" },
        { symbol: "δ", title: "delta" },
        { symbol: "∆", title: "Delta" },
        { symbol: "θ", title: "theta" },
        { symbol: "λ", title: "lambda" },
        { symbol: "μ", title: "mu" },
        { symbol: "π", title: "pi" },
        { symbol: "ρ", title: "rho" },
        { symbol: "τ", title: "tau" },
        { symbol: "φ", title: "phi" },
        { symbol: "Φ", title: "Phi" },
        { symbol: "Ψ", title: "psi" },
        { symbol: "Ω", title: "Omega" },
        { symbol: "ω", title: "omega" },
      ],
    },
    {
      title: "Operações",
      items: [
        { symbol: "∑", title: "somatório" },
        { symbol: "√", title: "raiz quadrada" },
        { symbol: "∛", title: "raiz cúbica" },
        { symbol: "±", title: "mais-menos" },
        { symbol: "×", title: "multiplicação" },
        { symbol: "·", title: "multiplicação" },
        { symbol: "÷", title: "divisão" },
        { symbol: "≈", title: "aproximadamente" },
        { symbol: "∞", title: "infinito" },
      ],
    },
    {
      title: "Comparação e conjuntos",
      items: [
        { symbol: "≠", title: "diferente" },
        { symbol: "≤", title: "menor ou igual" },
        { symbol: "≥", title: "maior ou igual" },
        { symbol: "∈", title: "pertence" },
        { symbol: "∉", title: "não pertence" },
        { symbol: "⊂", title: "subconjunto" },
        { symbol: "⊃", title: "contém" },
        { symbol: "∪", title: "união" },
        { symbol: "∩", title: "interseção" },
      ],
    },
  ];

  return (
    <div className="z-50 max-h-[min(78vh,520px)] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#08111F] sm:p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-black text-slate-950 dark:text-white">
            Símbolos
          </h5>

          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Toque em um símbolo para inserir no ponto atual do editor.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Fechar símbolos"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {symbolGroups.map((group) => (
          <section key={group.title} className="space-y-2">
            <h6 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {group.title}
            </h6>

            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {group.items.map((sym) => (
                <button
                  key={`${group.title}-${sym.symbol}`}
                  type="button"
                  title={sym.title}
                  onClick={() => {
                    onInsert(sym.symbol);
                    onClose?.();
                  }}
                  className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-black text-slate-800 transition hover:border-[#0E00D0]/40 hover:bg-[#0E00D0]/10 hover:text-[#0E00D0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E00D0]/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-100"
                >
                  {sym.symbol}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};


// ========== IMAGE LIGHTBOX ==========
const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape as any);
    return () => document.removeEventListener('keydown', handleEscape as any);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="Visualização ampliada"
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e: MouseEvent<HTMLImageElement>) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 cursor-pointer bg-black/50 rounded-full p-2 border border-white/20"
        aria-label="Fechar"
      >
        <X size={32} />
      </button>
    </div>
  );
};

// ========== CUSTOM KEYMAP ==========
const customKeymap: CustomKeymap[] = [
  {
    key: "Ctrl-b",
    mac: "Cmd-b",
    run: (view: EditorView) => {
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      view.dispatch({
        changes: { from, to, insert: `**${selected}**` },
        selection: { anchor: from + 2, head: to + 2 }
      });
      return true;
    }
  },
  {
    key: "Ctrl-i",
    mac: "Cmd-i",
    run: (view: EditorView) => {
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      view.dispatch({
        changes: { from, to, insert: `*${selected}*` },
        selection: { anchor: from + 1, head: to + 1 }
      });
      return true;
    }
  },
  {
    key: "Ctrl-l",
    mac: "Cmd-l",
    run: (view: EditorView) => {
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      view.dispatch({
        changes: { from, to, insert: `[${selected}](url)` },
        selection: { anchor: from + 1 + selected.length, head: from + 1 + selected.length }
      });
      return true;
    }
  }
];

const principiaEditorTheme = EditorView.theme({
  "&": {
    minHeight: "100%",
    backgroundColor: "transparent",
    color: "inherit",
    fontSize: "0.92rem",
  },
  ".cm-scroller": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    lineHeight: "1.6",
  },
  ".cm-content": {
    minHeight: "12rem",
    padding: "1rem",
    caretColor: "#0E00D0",
  },
  ".cm-line": {
    padding: "0 0.25rem",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(14, 0, 208, 0.22) !important",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-cursor": {
    borderLeftColor: "#0E00D0",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
});

// ========== COMPONENTE PRINCIPAL ==========
export default function MarkdownEditor({ initialContent = "", onChange }: MarkdownEditorProps) {
  const [content, setContent] = useState<string>(initialContent);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const editorViewRef = useRef<{ view: EditorView } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(initialContent || "");
  }, [initialContent]);

  // ========== EXTENSÕES DO EDITOR ==========
  const extensions = [
    markdown({
      codeLanguages: languages,
    }),
    keymap.of([...defaultKeymap, ...customKeymap]),
    EditorView.lineWrapping,
    principiaEditorTheme,
    mathStructurePlugin,
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        setContent(newValue);
        onChange?.(newValue);
      }
    })
  ];

  // ========== INSERT TEXT AT CURSOR ==========
  const insertAtCursor = useCallback((before: string, after: string = "") => {
    const view = editorViewRef.current?.view;
    if (!view) {
      const textarea = document.querySelector('.cm-content') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.substring(start, end);
        const newContent = content.substring(0, start) + before + selected + after + content.substring(end);
        setContent(newContent);

        setTimeout(() => {
          const newPos = start + before.length + selected.length;
          if (textarea.setSelectionRange) {
            textarea.setSelectionRange(newPos, newPos);
          }
          textarea.focus();
        }, 0);
      }
      return;
    }

    const selection = view.state.selection;
    const changes: Array<{ from: number; to: number; insert: string }> = [];

    selection.ranges.forEach(range => {
      const from = range.from;
      const to = range.to;
      const selected = view.state.sliceDoc(from, to);
      const insertion = before + selected + after;

      changes.push({ from, to, insert: insertion });
    });

    view.dispatch({
      changes,
      selection: {
        anchor: selection.main.from + before.length,
        head: selection.main.from + before.length
      }
    });

    view.focus();
  }, [content]);

  // ========== IMAGE UPLOAD HANDLERS ==========
  const uploadImage = async (file: File, isEdited: boolean = false): Promise<void> => {
    if (!file) return;

    if (isEdited) {
      setEditingImage(null);
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha no upload.');
      }

      if (result.url) {
        const altText = isEdited
          ? ''
          : file.name.replace(/\.[^/.]+$/, '');

        const markdownImage = `![${altText}](${result.url})`;

        // Insere com quebra de linha antes e depois
        insertAtCursor(`\n${markdownImage}\n`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(`Ocorreu um erro: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };


  const uploadEditedImage = async (file: File): Promise<void> => {
    await uploadImage(file, true);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setEditingImage(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (tab !== 'edit') return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      uploadImage(imageFiles[0]);
    }
  }, [tab]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (tab === 'edit') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // ========== TOOLBAR ACTIONS ==========
  const handleBold = (): void => insertAtCursor('**', '**');
  const handleItalic = (): void => insertAtCursor('*', '*');
  const handleSubscript = (): void => insertAtCursor('<sub>', '</sub>');
  const handleSuperscript = (): void => insertAtCursor('<sup>', '</sup>');
  const handleLink = (): void => insertAtCursor('[', '](url)');

  // ========== PREVIEW PROCESSING ==========
  useEffect(() => {
    if (tab === "preview") {
      setIsProcessing(true);

      const processContent = async (): Promise<void> => {
        try {
          const html = await processMarkdown(content);
          setPreviewHTML(html);
        } catch (error) {
          console.error('Erro ao processar:', error);
          setPreviewHTML(`<div style="color:red;">Erro: ${(error as Error).message}</div>`);
        } finally {
          setIsProcessing(false);
        }
      };

      const timeoutId = setTimeout(processContent, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [content, tab]);

  // ========== RENDER ==========
  return (
    <div
      className="flex max-h-[80vh] min-h-[240px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#020617]"
      role="presentation"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* INPUT DE ARQUIVO OCULTO */}
      <input
        accept="image/*,.jpeg,.jpg,.png"
        tabIndex={-1}
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* TOOLBAR */}
      <div className="flex min-h-12 shrink-0 flex-col gap-2 border-b border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-[#08111F] sm:min-h-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        {/* TABS */}
        <div className="mr-auto flex w-full gap-1 sm:w-auto">
          <TabButton
            isActive={tab === 'edit'}
            onClick={() => setTab('edit')}
            label="Editar"
            icon={PencilLine}
          />
          <TabButton
            isActive={tab === 'preview'}
            onClick={() => setTab('preview')}
            label="Pré-visualizar"
            icon={Eye}
          />
        </div>

        {/* BOTÕES DE FORMATAÇÃO */}
        {tab === 'edit' && (
          <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto sm:flex-nowrap">
            <div className="flex flex-wrap items-center justify-end gap-1 sm:flex-nowrap" id="editor-options">
              <Popover
                trigger={<ActionButton
                  title="Expressões matemáticas"
                  icon={Sigma}
                  onClick={(e) => { e.preventDefault(); }}
                />}
                onClose={() => { }}
              >
                <MathExpressionsPanel
                  onInsert={insertAtCursor}
                />
              </Popover>

              <Popover
                trigger={<ActionButton
                  title="Símbolos"
                  icon={Pi}
                  onClick={(e) => { e.preventDefault(); }}
                />}
                onClose={() => { }}
              >
                <SymbolsPanel onInsert={insertAtCursor} />
              </Popover>

              <VisibleActionButton
                onClick={handleBold}
                title="Negrito (Ctrl-b)"
                icon={Bold}
              />
              <HiddenActionButton
                onClick={handleItalic}
                title="Itálico (Ctrl-i)"
                icon={Italic}
              />
              <HiddenActionButton
                onClick={handleSubscript}
                title="Subscrito"
                icon={Subscript}
              />
              <HiddenActionButton
                onClick={handleSuperscript}
                title="Sobrescrito"
                icon={Superscript}
              />
              <VisibleActionButton
                onClick={handleLink}
                title="Link (Ctrl-l)"
                icon={LinkIcon}
              />
            </div>

            <ActionButton
              onClick={() => fileInputRef.current?.click()}
              title="Adicionar imagem"
              icon={ImagePlus}
              disabled={isUploading}
            />
          </div>
        )}
      </div>

      {/* ÁREA DO EDITOR/PREVIEW */}
      <div className="flex flex-col md:flex-row flex-1 overflow-y-auto min-h-[200px] relative 
      focus-within:border-[#0E00D0]
focus-within:ring-2
focus-within:ring-[#0E00D0]/30
focus-within:ring-offset-0
bg-[#0F172A]
      
      ">
        {tab === 'edit' && isDragging && (
          <div className="absolute inset-3 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-400 bg-blue-500/10 dark:bg-blue-500/20">
            <div className="text-center text-[#0E00D0] dark:text-blue-400">
              <ImagePlus size={48} className="mx-auto mb-2" />
              <p className="font-semibold">Solte a imagem aqui</p>
            </div>
          </div>
        )}

        {tab === 'edit' && isUploading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-sm dark:bg-black/50">
            <div className="text-center text-slate-950 dark:text-white">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-[#0E00D0] dark:border-white"></div>
              <p>Enviando imagem...</p>
            </div>
          </div>
        )}

        {tab === "edit" ? (
          <div className="min-h-[12rem] w-full cursor-text text-sm text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100">
            <CodeMirror
              ref={editorViewRef}
              value={content}
              height="100%"
              extensions={extensions}
              onChange={(value: string) => {
                setContent(value);
                onChange?.(value);
              }}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: false,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: false,
                rectangularSelection: false,
                crosshairCursor: false,
                highlightActiveLine: false,
                highlightSelectionMatches: false,
                closeBracketsKeymap: false,
                searchKeymap: false,
                foldKeymap: false,
                completionKeymap: false,
                lintKeymap: false,
              }}
            />
          </div>
        ) : (
          <div
            className="wmde-markdown wmde-markdown-color w-full flex-1 overflow-auto rounded-none bg-white px-4 py-4 text-sm text-slate-900 placeholder:text-slate-400 dark:bg-[#0F172A] dark:text-slate-100 [&_.mord]:!mr-0 [&_ol]:list-[upper-roman] [&_ul]:list-disc"
            style={{
              '--color-canvas-default': 'transparent',
              '--color-fg-default': 'currentColor',
              fontSize: '0.875rem',
              lineHeight: '1.25rem'
            } as React.CSSProperties}
            onClick={(e: MouseEvent<HTMLDivElement>) => {
              if (e.target instanceof HTMLImageElement) {
                setZoomedImageUrl(e.target.src);
              }
            }}
          >
            {isProcessing ? (
              <div className="flex h-full min-h-[12rem] items-center justify-center text-slate-600 dark:text-slate-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Processando...</span>
              </div>
            ) : previewHTML ? (
              <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
            ) : (
              <div className="py-8 text-center italic text-slate-500 dark:text-slate-400">
                Nenhum conteúdo para visualizar
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DE IMAGEM */}
      {editingImage && (
        <ImageEditorModal
          image={editingImage}
          open={!!editingImage}
          onOpenChange={(isOpen: boolean) => !isOpen && setEditingImage(null)}
          onConfirm={uploadEditedImage}
        />
      )}

      {/* LIGHTBOX PARA IMAGENS */}
      {zoomedImageUrl && (
        <ImageLightbox
          imageUrl={zoomedImageUrl}
          onClose={() => setZoomedImageUrl(null)}
        />
      )}
    </div>
  );
}
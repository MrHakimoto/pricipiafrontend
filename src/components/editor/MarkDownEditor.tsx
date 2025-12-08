// components/editor/MarkdownEditor.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef, MouseEvent, KeyboardEvent, ChangeEvent, DragEvent, ReactElement, ReactNode } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap } from "@codemirror/commands";
import { EditorView, keymap, ViewUpdate } from "@codemirror/view";
import { dracula } from "@uiw/codemirror-theme-dracula";
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
    className={`
  relative flex items-center gap-1.5 px-4 h-full text-xs font-semibold
  transition-all duration-200 outline-none
  focus-visible:ring-2 focus-visible:ring-[#0E00D0]/40

  ${isActive
        ? `
          bg-[#0F172A]        
          text-white
          border border-[#0E00D0]
          shadow-md
          rounded-t-lg

      `
        : `
          bg-muted/50        
          text-muted-foreground
          border-b border-border
          hover:bg-[#111C36]
      `
      }
`}

    aria-label={label}
  >
    <Icon className="w-4 h-4" aria-hidden="true" />
    <span className="hidden sm:block">{label}</span>
  </button>
);

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, title, icon: Icon, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className="inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground size-8 p-1 text-xs h-7 w-7 cursor-pointer border border-transparent hover:border-border"
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
    className="items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&>svg]:w-4 [&>svg]:h-4 gap-2 hover:bg-accent hover:text-accent-foreground sm:flex h-7 w-7 flex cursor-pointer border border-transparent hover:border-border"
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
    className="items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&>svg]:w-4 [&>svg]:h-4 gap-2 hover:bg-accent hover:text-accent-foreground hidden sm:flex h-7 w-7 cursor-pointer border border-transparent hover:border-border"
    aria-label={title}
  >
    <Icon aria-hidden="true" className="w-4 h-4" />
  </button>
);

// ========== POPOVER COMPONENT ==========
const Popover: React.FC<PopoverProps> = ({ trigger, children, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside as any);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as any);
    };
  }, [isOpen, onClose]);

  const toggle = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setCoords({
      top: rect.bottom + 8, // abre logo abaixo do botão
      left: rect.left
    });

    setIsOpen(prev => !prev);
  };

  return (
    <>
      <div ref={triggerRef} onClick={toggle} className="cursor-pointer inline-flex">
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 999999
          }}
          className="bg-muted/50 border border-border rounded-md shadow-lg"
        >
          {React.cloneElement(children, { onClose: () => setIsOpen(false) })}
        </div>
      )}
    </>
  );
};


// ========== SYMBOLS PANEL ==========
const SymbolsPanel: React.FC<SymbolsPanelProps> = ({ onClose, onInsert }) => {
  const symbols: Symbol[] = [
    { symbol: '∑', title: 'sigma' },
    { symbol: '∆', title: 'Delta' },
    { symbol: 'δ', title: 'delta' },
    { symbol: 'α', title: 'alpha' },
    { symbol: 'β', title: 'beta' },
    { symbol: 'η', title: 'eta' },
    { symbol: 'γ', title: 'gamma' },
    { symbol: 'θ', title: 'theta' },
    { symbol: 'λ', title: 'lambda' },
    { symbol: 'μ', title: 'mu' },
    { symbol: 'π', title: 'pi' },
    { symbol: 'ρ', title: 'rho' },
    { symbol: 'τ', title: 'tau' },
    { symbol: 'Φ', title: 'Phi' },
    { symbol: 'φ', title: 'phi' },
    { symbol: 'Ψ', title: 'psi' },
    { symbol: 'Ω', title: 'Omega' },
    { symbol: 'ω', title: 'omega' },
    { symbol: '≈', title: 'aproximadamente' },
    { symbol: '±', title: 'mais-menos' },
    { symbol: '√', title: 'raíz quadrada' },
    { symbol: '∛', title: 'raíz cubica' },
    { symbol: '∞', title: 'infinito' },
    { symbol: '≠', title: 'diferente' },
    { symbol: '≤', title: 'menor ou igual' },
    { symbol: '≥', title: 'maior ou igual' },
    { symbol: '×', title: 'multiplicação' },
    { symbol: '·', title: 'multiplicação' },
    { symbol: '÷', title: 'divisão' }
  ];

  return (
    <div className="z-50 rounded-lg border bg-muted/50 p-4 shadow-md w-[320px]">
      <h5 className="font-medium text-sm mb-4 text-muted-foreground">
        Símbolos
      </h5>

      <div className="grid grid-cols-7 gap-2">
        {symbols.map((sym, index) => (
          <button
            key={index}
            type="button"
            title={sym.title}
            onClick={() => {
              onInsert(sym.symbol);
              onClose?.();
            }}
            className="inline-flex items-center justify-center text-base font-medium transition-colors rounded-md border border-border hover:bg-accent h-9 w-9"
          >
            {sym.symbol}
          </button>
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
      className="flex flex-col bg-input rounded-md border border-border
    transition-all
    "
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
      <div className="flex flex-row justify-between bg-muted/50 h-9 shrink-0">
        {/* TABS */}
        <div className="translate-y-[0px] mr-auto flex">
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
          <div className="flex items-center gap-1 px-2 py-1">
            <div className="flex items-center gap-1" id="editor-options">
              <Popover
                trigger={<ActionButton
                  title="Expressões matemáticas"
                  icon={Sigma}
                  onClick={(e) => { e.preventDefault(); }}
                />}
                onClose={() => { }}
              >
                <div>
                  <MathExpressionsPanel
                    onInsert={insertAtCursor}
                  />
                </div>
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
          <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-md z-10 flex items-center justify-center">
            <div className="text-blue-400 text-center">
              <ImagePlus size={48} className="mx-auto mb-2" />
              <p className="font-semibold">Solte a imagem aqui</p>
            </div>
          </div>
        )}

        {tab === 'edit' && isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-md z-20 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Enviando imagem...</p>
            </div>
          </div>
        )}

        {tab === "edit" ? (
          <div className="
          cursor-text w-full text-sm placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[6rem]">
            <CodeMirror
              ref={editorViewRef}
              value={content}
              height="100%"
              extensions={extensions}
              onChange={(value: string) => {
                setContent(value);
                onChange?.(value);
              }}
              theme={dracula}
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
            className="wmde-markdown wmde-markdown-color w-full text-sm rounded-md placeholder:text-muted-foreground/50 [&_ul]:list-disc [&_ol]:list-[upper-roman] [&_.mord]:!mr-0 px-3 py-2 flex-1 min-h-[6rem] overflow-auto"
            style={{
              '--color-canvas-default': 'rgb(var(--input))',
              '--color-fg-default': 'rgb(var(--foreground))',
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
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Processando...</span>
              </div>
            ) : previewHTML ? (
              <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
            ) : (
              <div className="text-gray-500 italic text-center py-8">
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
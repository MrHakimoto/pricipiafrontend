"use client";

import React, { useState, useRef, useEffect } from "react";
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
// 1. COMPONENTES DE UI REUTILIZÁVEIS (BOTÕES E POPOVER)
// ====================================================================

const TabButton = ({ isActive, onClick, label, icon: Icon }) => (
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

const ActionButton = ({ onClick, title, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="h-7 w-7 flex items-center justify-center rounded-md text-gray-300 hover:bg-gray-700/80 transition-colors"
  >
    <Icon className="w-4 h-4" />
  </button>
);

const Popover = ({ trigger, content }) => {
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

  const contentWithClose = React.cloneElement(content, { onClose: () => setIsOpen(false) });

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
// 2. PAINÉIS DE CONTEÚDO PARA OS POPOVERS (COM CORREÇÕES)
// ====================================================================

const MathExpressionsPanel = ({ onClose, onInsert }) => {
  const expressionButtons = [
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
      <div className="flex justify-between items-center p-4 border-b border-gray-700"><h2 className="text-lg font-semibold text-white">Expressões</h2><button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button></div>
      <div className="p-3 grid grid-cols-4 gap-2 border-b border-gray-700">
        {expressionButtons.map((btn, index) => (<button key={index} onClick={() => { onInsert(btn.insert[0], btn.insert[1] || ''); onClose(); }} className="bg-gray-800 text-white p-3 rounded-md hover:bg-gray-700 flex items-center justify-center text-base h-14"><InlineMath math={btn.math} /></button>))}
      </div>
      <div className="p-3 flex gap-3"><button onClick={() => { onInsert('$$', '$$'); onClose(); }} className="flex-1 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-md">&lt;&gt; Em linha</button><button onClick={() => { onInsert('```katex\n', '\n```'); onClose(); }} className="flex-1 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-md">{`{}`} Em bloco</button></div>
    </div>
  );
};

const SymbolsPanel = ({ onClose, onInsert }) => {
  // CORREÇÃO: Backslashes duplicados para funcionar em strings JavaScript
  const symbols = ['\\alpha', '\\beta', '\\gamma', '\\delta', '\\theta', '\\lambda', '\\mu', '\\pi', '\\rho', '\\sigma', '\\tau', '\\phi', '\\psi', '\\omega', '\\Sigma', '\\Delta', '\\Phi', '\\Psi', '\\Omega', '\\approx', '\\pm', '\\infty', '\\neq', '\\le', '\\ge', '\\times', '\\cdot', '\\div', '\\int', '\\sum', '\\prod'];
  return (
    <div className="#bg-[#00091A] rounded-lg shadow-xl w-full max-w-sm border border-gray-700" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b border-gray-700"><h2 className="text-lg font-semibold text-white">Símbolos</h2><button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button></div>
      <div className="p-3 grid grid-cols-8 gap-1">
        {symbols.map((symbol, index) => (<button key={index} onClick={() => { onInsert(`$$${symbol}$$`); onClose(); }} className="bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center justify-center text-lg h-11 w-11"><InlineMath math={symbol} /></button>))}
      </div>
    </div>
  );
};


const ImageLightbox = ({ imageUrl, onClose }) => {
  return (
    // Portal para garantir que o lightbox fique no topo de tudo
    <FloatingPortal>
      <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
        onClick={onClose} // Fecha ao clicar no fundo
      >
        <img 
          src={imageUrl} 
          alt="Visualização ampliada" 
          className="max-w-[90vw] max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()} // Impede que o clique na imagem feche o modal
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
// 3. COMPONENTE PRINCIPAL DO EDITOR
// ====================================================================

export default function MarkdownEditor({initialContent, onChange, editorStyle = {}, containerClassName = "" }) {
  const [mode, setMode] = useState("edit");
  const [content, setContent] = useState(initialContent || "");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);



  const handleChange = (e) => {
    setContent(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  // CORREÇÃO: Função 'insertAtCursor' simplificada, sem placeholder
  const insertAtCursor = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    let start, end;

    // Verifica se a textarea é o elemento ativo no documento
    if (document.activeElement === textarea) {
      // Se estiver em foco, usa a seleção atual do cursor.
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
    } else {
      // Se NÃO estiver em foco, define a posição para o final do texto.
      start = content.length;
      end = content.length;
    }

    const selected = content.substring(start, end);
    const newText = content.substring(0, start) + before + selected + after + content.substring(end);
    
    setContent(newText);

    // Foca na textarea e posiciona o cursor após o texto inserido
    textarea.focus();
    setTimeout(() => {
      const newPosition = start + before.length + selected.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setEditingImage(file);
    }
    // Limpa o valor para que o mesmo arquivo possa ser selecionado novamente
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadEditedImage = async (file) => {
    setEditingImage(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Falha no upload.');

      if (result.url) {
        insertAtCursor("![", `](${result.url})`, "legenda");
      }
    } catch (error) {
      console.error(error);
      alert(`Ocorreu um erro: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-md border border-gray-700 bg-[#00091A] shadow text-white ${containerClassName}`}>
      {/* Toolbar */}
      <div className="flex flex-row justify-between bg-gray-800/50 h-9 shrink-0 border-b border-gray-700">
        <div className="flex"><TabButton isActive={mode === 'edit'} onClick={() => setMode('edit')} label="Editar" icon={PencilLine} /><TabButton isActive={mode === 'preview'} onClick={() => setMode('preview')} label="Pré-visualizar" icon={Eye} /></div>
        {mode === 'edit' && (
          <div className="flex items-center gap-1 px-2 py-1 flex-wrap">
            <ActionButton onClick={() => insertAtCursor("**", "**")} title="Negrito" icon={Bold} />
            <ActionButton onClick={() => insertAtCursor("_", "_")} title="Itálico" icon={Italic} />
            <ActionButton onClick={() => insertAtCursor("~~", "~~")} title="Riscado" icon={Strikethrough} />
            <ActionButton onClick={() => insertAtCursor("<sub>", "</sub>")} title="Subscrito" icon={Subscript} />
            <ActionButton onClick={() => insertAtCursor("<sup>", "</sup>")} title="Sobrescrito" icon={Superscript} />
            <ActionButton onClick={() => insertAtCursor("[", "](url)")} title="Link" icon={LinkIcon} />
            <ActionButton onClick={() => fileInputRef.current.click()}
              title={isUploading ? "Enviando..." : "Adicionar Imagem"}
              icon={ImagePlus}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
            <div className="shrink-0 bg-gray-600 h-full w-[1px] mx-1" />

            {/* Simbolos Matemáticos */}
            <Popover trigger={<ActionButton title="Expressão Matemática" icon={Sigma} />} content={<MathExpressionsPanel onInsert={insertAtCursor} />} />
            <Popover trigger={<ActionButton title="Símbolos" icon={Pi} />} content={<SymbolsPanel onInsert={(text) => insertAtCursor(text, '')} />} />

            <div className="shrink-0 bg-gray-600 h-full w-[1px] mx-1" />
            <button className="h-6 w-6 flex items-center justify-center rounded-sm text-xs bg-gray-600/80 hover:bg-gray-600/60 text-gray-300" title="Ajuda"><CircleHelp className="w-3.5 h-3.5" /></button>
            {editingImage && (
              <ImageEditorModal
                image={editingImage}
                open={!!editingImage}
                onOpenChange={(isOpen) => !isOpen && setEditingImage(null)}
                onConfirm={uploadEditedImage}
              />
            )}
          </div>
        )}
      </div>

      {/* Área do editor / preview */}
      {mode === "edit" ? (
        <textarea style={editorStyle} ref={textareaRef} id="md-editor" className="w-full h-96 p-4 bg-[#00091A] text-gray-200 font-mono text-sm outline-none resize-y" value={content} onChange={handleChange} />
      ) : (
        <div style={editorStyle} className="prose prose-invert max-w-none p-4 min-h-[20px]">
          <ReactMarkdown
            children={content}
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                if (language.toLowerCase() === 'katex' && !inline) { return <BlockMath math={String(children).replace(/\n$/, '')} />; }
                return !inline ? (<pre className="bg-gray-800 rounded-md p-3"><code className={className} {...props}>{children}</code></pre>) : (<code className="bg-gray-700 rounded-sm px-1 py-0.5 text-sm" {...props}>{children}</code>);
              },
              img: ({node, ...props}) => (
                <img 
                  {...props} 
                  className="cursor-pointer transition-transform hover:scale-105" 
                  onClick={() => setZoomedImageUrl(props.src)} // Ativa o lightbox ao clicar
                />
              ),
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
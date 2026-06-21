// utils/markdownProcessorPreview.ts

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/* ============================================================
 ✅ CONFIG
============================================================ */

const PREVIEW_LIMIT = 220;

/* ============================================================
 ✅ NORMALIZAR ESPAÇOS
============================================================ */

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ============================================================
 ✅ LIMPAR IMAGENS → (imagem)
============================================================ */

function replaceImagesToPlaceholder(markdown: string): string {
  return markdown.replace(/!\[[^\]]*?\]\([^)]+?\)/g, '(imagem)');
}

/* ============================================================
 ✅ LIMPAR HTML DE IMAGENS → (imagem)
============================================================ */

function replaceHtmlImagesToPlaceholder(markdown: string): string {
  return markdown.replace(/<img\b[^>]*>/gi, '(imagem)');
}

/* ============================================================
 ✅ REMOVER TABELAS MARKDOWN GRANDES → (tabela)
============================================================ */

function removeTables(markdown: string): string {
  return markdown.replace(
    /(?:^|\n)(\|[^\n]*\|\n\|[\s:|.-]*\|\n(?:\|[^\n]*\|\n?)*)/g,
    '\n(tabela)\n'
  );
}

/* ============================================================
 ✅ BLOCO ```KaTeX ... ``` → (fórmula)
============================================================ */

function simplifyKaTeXBlocks(markdown: string): string {
  return markdown.replace(/```KaTeX\s*\n[\s\S]*?```/gi, '(fórmula)');
}

/* ============================================================
 ✅ FÓRMULA ENTRE CRASES `$$...$$` → (fórmula)
============================================================ */

function simplifyBacktickDisplayMath(markdown: string): string {
  return markdown.replace(/`\$\$[\s\S]*?\$\$`/g, '(fórmula)');
}

/* ============================================================
 ✅ BLOCO $$...$$ → (fórmula)
============================================================ */

function simplifyDisplayMath(markdown: string): string {
  return markdown.replace(/\$\$[\s\S]*?\$\$/g, '(fórmula)');
}

/* ============================================================
 ✅ INLINE $...$ → (fórmula)
============================================================ */

function simplifyInlineMath(markdown: string): string {
  return markdown.replace(/\$([^\n$]+?)\$/g, '(fórmula)');
}

/* ============================================================
 ✅ BLOCOS DE CÓDIGO COMUNS → (código)
============================================================ */

function simplifyCodeBlocks(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '(código)');
}

/* ============================================================
 ✅ REMOVER HTML PESADO / PERIGOSO
============================================================ */

function sanitizePreviewHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<table[\s\S]*?<\/table>/gi, '(tabela)')
    .replace(/<img[^>]*>/gi, '(imagem)')
    .replace(/<pre[\s\S]*?<\/pre>/gi, '(código)')
    .replace(/<code[\s\S]*?<\/code>/gi, '(código)');
}

/* ============================================================
 ✅ HTML → TEXTO PURO
============================================================ */

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================================
 ✅ CORTAR TEXTO LIMPO
============================================================ */

function limitTextLength(text: string, limit: number): string {
  const clean = normalizeWhitespace(text);

  if (clean.length <= limit) return clean;

  return clean.slice(0, limit).trimEnd() + '...';
}

/* ============================================================
 ✅ PIPELINE DE LIMPEZA
============================================================ */

function preparePreviewMarkdown(content: string): string {
  let preview = content || '';

  preview = normalizeWhitespace(preview);

  /*
    A ordem importa:

    1. Primeiro retirar fórmulas, inclusive `$$...$$`;
    2. Depois retirar blocos de código;
    3. Depois imagens e tabelas.
  */

  preview = simplifyKaTeXBlocks(preview);
  preview = simplifyBacktickDisplayMath(preview);
  preview = simplifyDisplayMath(preview);
  preview = simplifyInlineMath(preview);

  preview = simplifyCodeBlocks(preview);

  preview = replaceImagesToPlaceholder(preview);
  preview = replaceHtmlImagesToPlaceholder(preview);

  preview = removeTables(preview);

  return normalizeWhitespace(preview);
}

/* ============================================================
 ✅ PROCESSADOR DE PREVIEW
============================================================ */

export async function processMarkdownPreview(content: string): Promise<string> {
  try {
    const preview = preparePreviewMarkdown(content);

    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, {
        allowDangerousHtml: false,
      })
      .use(rehypeStringify)
      .process(preview);

    let html = String(file);

    html = sanitizePreviewHtml(html);

    const plainText = htmlToPlainText(html);
    const limited = limitTextLength(plainText, PREVIEW_LIMIT);

    return limited || 'Sem prévia disponível.';
  } catch (error) {
    console.error('Erro ao gerar preview:', error);

    return '(erro ao gerar preview)';
  }
}
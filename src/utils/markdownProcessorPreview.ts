import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import katex from 'katex';

/* ============================================================
 ✅ CONFIG
============================================================ */

const PREVIEW_LIMIT = 220; // <<< CONTROLE AQUI O TAMANHO DO PREVIEW

/* ============================================================
 ✅ LIMPAR IMAGENS → (imagem)
============================================================ */

function replaceImagesToPlaceholder(markdown: string): string {
  return markdown.replace(/!\[.*?\]\(.*?\)/g, '(imagem)');
}

/* ============================================================
 ✅ REMOVER TABELAS GRANDES
============================================================ */

function removeTables(markdown: string): string {
  return markdown.replace(/\|(.+)\|\n\|([-:| ]+)\|\n([\s\S]*?)(\n\n|$)/g, '(tabela)');
}

/* ============================================================
 ✅ SIMPLIFICAR BLOCO KATEX → (fórmula)
============================================================ */

function simplifyKaTeXBlocks(markdown: string): string {
  return markdown.replace(/```KaTeX[\s\S]*?```/gi, '(fórmula)');
}

/* ============================================================
 ✅ SIMPLIFICAR $$...$$
============================================================ */

function simplifyDisplayMath(markdown: string): string {
  return markdown.replace(/\$\$[\s\S]*?\$\$/g, '(fórmula)');
}

/* ============================================================
 ✅ CORTAR TEXTO LIMPO
============================================================ */

function limitTextLength(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + '...';
}

/* ============================================================
 ✅ PROCESSADOR DE PREVIEW (EXPORTADO)
============================================================ */

export async function processMarkdownPreview(content: string): Promise<string> {
  try {
    let preview = content;

    // 1. Substituir imagens
    preview = replaceImagesToPlaceholder(preview);

    // 2. Remover tabelas pesadas
    preview = removeTables(preview);

    // 3. Remover blocos KaTeX
    preview = simplifyKaTeXBlocks(preview);

    // 4. Remover fórmulas grandes $$ $$
    preview = simplifyDisplayMath(preview);

    // 5. Converter para HTML simples
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(preview);

    let html = String(file);

    // 6. Remover tags perigosas de preview
    html = html
      .replace(/<table[\s\S]*?<\/table>/gi, '(tabela)')
      .replace(/<img[^>]*>/gi, '(imagem)')
      .replace(/<pre[\s\S]*?<\/pre>/gi, '(código)')
      .replace(/<\/?[^>]+(>|$)/g, match => {
        // permitir apenas tags básicas
        if (
          match.match(/^<\/?(p|strong|em|b|i|u|br|span)/)
        ) return match;
        return '';
      });

    // 7. Cortar tamanho final
    const plainText = html.replace(/<[^>]+>/g, '');
    const limited = limitTextLength(plainText, PREVIEW_LIMIT);

    return limited;

  } catch (error) {
    console.error('Erro ao gerar preview:', error);
    return '(erro ao gerar preview)';
  }
}

// utils/markdownProcessorAlternativas.ts

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import katex from 'katex';

import type {
  Root,
  Element,
  Text,
  Comment,
  RootContent
} from 'hast';

/* ============================================================
 ✅ TIPOS AUXILIARES
============================================================ */

type HastNode = Root | RootContent | Element | Text | Comment;

type KaTeXRenderError = {
  message: string;
};

/* ============================================================
 ✅ GERADOR DE SLUGS
============================================================ */

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/* ============================================================
 ✅ PROCESSADOR DE IMAGENS
============================================================ */

function processImagesWithContainer(html: string): string {
  return html.replace(
    /<img src="([^"]+)" alt="([^"]*)"([^>]*)>/g,
    (_match: string, src: string, alt: string, attrs: string) => {
      let aspectRatio = 1;

      if (src.includes('1920x2586')) {
        aspectRatio = 0.742459;
      }

      const style = `max-height: 320px; width: fit-content; aspect-ratio: ${aspectRatio} / 1;`;

      return `
<span class="block mt-3 mb-3" role="region">
  <span class="relative group overflow-hidden block rounded-md object-contain !bg-background/50 cursor-pointer transition-[box-shadow] hover:ring-2 dark:hover:ring-tertiary/90 ring-tertiary/75 mx-auto" style="${style}">
    <img alt="${alt || ''}" src="${src}" style="${style}" ${attrs}>
  </span>
</span>`;
    }
  );
}

/* ============================================================
 ✅ PLUGIN: ÂNCORAS EM HEADINGS
============================================================ */

function headingAnchors() {
  return (tree: Root): void => {
    const extractText = (node: HastNode): string => {
      if (node.type === 'text') return node.value;

      if ('children' in node && Array.isArray(node.children)) {
        return node.children.map(extractText).join('');
      }

      return '';
    };

    const visit = (node: HastNode): void => {
      if (
        node.type === 'element' &&
        /^h[1-6]$/.test(node.tagName)
      ) {
        const headingText = node.children.map(extractText).join('');

        if (headingText) {
          const slug = generateSlug(headingText);
          const id = `user-content-${slug}`;

          node.properties = {
            ...(node.properties || {}),
            id
          };

          const anchor: Element = {
            type: 'element',
            tagName: 'a',
            properties: {
              href: `#${slug}`,
              target: '_blank',
              tabIndex: '-1',
              'aria-hidden': 'true'
            },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: {
                  className: ['octicon', 'octicon-link']
                },
                children: []
              }
            ]
          };

          node.children.unshift(anchor);
        }
      }

      if ('children' in node && Array.isArray(node.children)) {
        node.children.forEach(child => visit(child as HastNode));
      }
    };

    visit(tree);
  };
}

/* ============================================================
 ✅ PLUGIN: BLOCO DE CÓDIGO SIMPLES
============================================================ */

function simpleCodeBlocks() {
  return (tree: Root): void => {
    const visit = (node: HastNode): void => {
      if (
        node.type === 'element' &&
        node.tagName === 'pre' &&
        node.children?.[0]?.type === 'element' &&
        node.children[0].tagName === 'code'
      ) {
        const codeNode = node.children[0];

        const classes = (codeNode.properties?.className || []) as string[];
        const langClass = classes.find(c => c?.startsWith('language-'));
        const lang = langClass?.replace('language-', '') || 'text';

        node.properties = {
          ...(node.properties || {}),
          className: [`language-${lang}`],
          style: 'background-color: transparent;'
        };

        codeNode.properties = {
          ...(codeNode.properties || {}),
          className: [`language-${lang}`, 'code-highlight']
        };

        if (!node.children.some(child => child.type === 'element' && child.tagName === 'div')) {
          node.children.push({
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          });
        }
      }

      if ('children' in node && Array.isArray(node.children)) {
        node.children.forEach(child => visit(child as HastNode));
      }
    };

    visit(tree);
  };
}

/* ============================================================
 ✅ DETECTA FÓRMULA DISPLAY/BLOCO
============================================================ */

function shouldUseDisplayMode(formula: string): boolean {
  return (
    formula.includes('\n') ||
    /\\begin\{(array|cases|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|matrix|aligned|gathered|alignedat)\}/.test(formula) ||
    formula.includes('\\displaystyle')
  );
}

/* ============================================================
 ✅ NORMALIZA FÓRMULA
============================================================ */

function normalizeLatexFormula(formula: string): string {
  /*
    NÃO trocar "\\\\" por "\\".

    Em LaTeX/KaTeX, "\\" é sintaxe legítima para quebra de linha
    em array, cases, matrix, pmatrix etc.

    Exemplo necessário:
    \text{Objeto} & \text{Expressão}\\
  */
  return formula.trim();
}

/* ============================================================
 ✅ KaTeX ENTRE CRASES
============================================================ */

function processBacktickKaTeX(content: string): string {
  return content.replace(/`\$\$([\s\S]*?)\$\$`/g, (_match: string, formula: string) => {
    try {
      const cleanFormula = normalizeLatexFormula(formula);
      const displayMode = shouldUseDisplayMode(cleanFormula);

      const katexHTML = katex.renderToString(cleanFormula, {
        throwOnError: false,
        displayMode,
        strict: false,
        output: 'html'
      });

      if (displayMode) {
        return `<div class="math-display">${katexHTML}</div>`;
      }

      return `<span class="math-inline">${katexHTML}</span>`;
    } catch (error) {
      const err = error as KaTeXRenderError;

      console.error('Erro ao renderizar KaTeX:', err);

      return `<span class="math-inline-error">Erro KaTeX: ${formula}</span>`;
    }
  });
}

/* ============================================================
 ✅ ESCAPAR FÓRMULAS SEM CRASES
============================================================ */

function escapeNonBacktickMath(content: string): string {
  const backtickMatches: string[] = [];

  let tempContent = content.replace(/`\$\$([\s\S]*?)\$\$`/g, match => {
    backtickMatches.push(match);
    return `__BACKTICK_FORMULA_${backtickMatches.length - 1}__`;
  });

  let escaped = tempContent.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
    return `$$${formula
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}$$`;
  });

  escaped = escaped.replace(/\$([^\n$]+)\$/g, (_match, formula: string) => {
    return `$${formula
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}$`;
  });

  backtickMatches.forEach((match, index) => {
    escaped = escaped.replace(`__BACKTICK_FORMULA_${index}__`, match);
  });

  return escaped;
}

/* ============================================================
 ✅ FUNÇÃO PRINCIPAL EXPORTADA
============================================================ */

export async function markdownProcessorAlternativas(content: string): Promise<string> {
  try {
    console.log('Processando Markdown...');

    // 1. Processar fórmulas entre crases
    let processedContent = processBacktickKaTeX(content);

    // 2. Escapar fórmulas sem crases
    processedContent = escapeNonBacktickMath(processedContent);

    // 3. Processar blocos KaTeX especiais (```KaTeX)
    const katexBlocks: string[] = [];

    processedContent = processedContent.replace(
      /```KaTeX\s*\n([\s\S]*?)```/gi,
      (_match: string, formula: string) => {
        try {
          const cleanFormula = normalizeLatexFormula(formula);

          const katexHTML = katex.renderToString(cleanFormula, {
            throwOnError: false,
            displayMode: true,
            strict: false,
            output: 'html'
          });

          katexBlocks.push(katexHTML);

          return `\n\n<!-- KATEX_BLOCK_${katexBlocks.length - 1} -->\n\n`;
        } catch (error) {
          const err = error as KaTeXRenderError;

          katexBlocks.push(
            `<span class="math-inline-error">Erro KaTeX: ${err.message}</span>`
          );

          return `\n\n<!-- KATEX_BLOCK_${katexBlocks.length - 1} -->\n\n`;
        }
      }
    );

    // 4. Processar com unified
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, {
        allowDangerousHtml: true
      })
      .use(simpleCodeBlocks)
      .use(headingAnchors)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        allowDangerousCharacters: true
      })
      .process(processedContent);

    let html = String(file);

    // 5. Restaurar blocos KaTeX especiais
    katexBlocks.forEach((block, index) => {
      html = html.replace(
        `<!-- KATEX_BLOCK_${index} -->`,
        `<div class="math-display katex-block">${block}</div>`
      );
    });

    // 6. Pós-processamento
    html = processImagesWithContainer(html);

    // NÃO alterar classes internas do KaTeX.
    // Não usar fixMathrmClasses.
    // O KaTeX precisa preservar mathnormal, mathit, mathbb, mathrm etc.

    html = html.replace(
      /<a href="([^"]+)"(?![^>]*target=)/g,
      '<a target="_blank" rel="noopener noreferrer" href="$1"'
    );

    // 7. Adicionar container final com estilos
    return `
<div class="markdown-body wmde-markdown wmde-markdown-color"
     style="
       --color-canvas-default: transparent;
       --color-fg-default: currentColor;
       font-size: 0.875rem;
       line-height: 1.25rem;
     ">
  ${html}
</div>`;

  } catch (error) {
    const err = error as Error;

    console.error('Erro ao processar Markdown:', err);

    return `<div style="color: red; padding: 20px; border: 1px solid red;">
      <strong>Erro:</strong> ${err.message}
    </div>`;
  }
}
// utils/markdownProcessor.ts

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import katex from 'katex';

type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

// ✅ FUNÇÃO PARA GERAR SLUGS
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

// ✅ FUNÇÃO PARA PROCESSAR IMAGENS COM CONTAINER
function processImagesWithContainer(html: string): string {
  return html.replace(
    /<img src="([^"]+)" alt="([^"]*)"([^>]*)>/g,
    (match: string, src: string, alt: string, attrs: string) => {
      let aspectRatio = 1;

      if (src.includes('1920x2586')) {
        aspectRatio = 0.742459;
      }

      const style = `max-height: 320px; width: fit-content; aspect-ratio: ${aspectRatio} / 1;`;

      return `<span class="block mt-3 mb-3" role="region">
                <span class="relative group overflow-hidden block rounded-md object-contain !bg-background/50 cursor-pointer transition-[box-shadow] hover:ring-2 dark:hover:ring-tertiary/90 ring-tertiary/75 mx-auto" style="${style}">
                  <img alt="${alt || ''}" src="${src}" style="${style}" ${attrs}>
                </span>
              </span>`;
    }
  );
}

// ✅ PLUGIN PARA ADICIONAR ÂNCORAS AOS HEADINGS
function headingAnchors() {
  return (tree: HastNode) => {
    const extractText = (node: HastNode): string => {
      if (node.type === 'text') return node.value || '';
      if (node.children) return node.children.map(extractText).join('');
      return '';
    };

    const visit = (node: HastNode): HastNode => {
      if (node.type === 'element' && node.tagName && /^h[1-6]$/.test(node.tagName)) {
        const headingText = node.children?.map(extractText).join('') || '';

        if (headingText) {
          const slug = generateSlug(headingText);
          const id = `user-content-${slug}`;

          node.properties = {
            ...(node.properties || {}),
            id,
          };

          node.children = node.children || [];

          node.children.unshift({
            type: 'element',
            tagName: 'a',
            properties: {
              href: `#${slug}`,
              target: '_blank',
              tabIndex: '-1',
              'aria-hidden': 'true',
            },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: {
                  className: ['octicon', 'octicon-link'],
                },
                children: [],
              },
            ],
          });
        }
      }

      if (node.children) {
        node.children.forEach((child) => visit(child));
      }

      return node;
    };

    visit(tree);
  };
}

// ✅ PLUGIN SIMPLES PARA BLOCO DE CÓDIGO
function simpleCodeBlocks() {
  return (tree: HastNode) => {
    const visit = (node: HastNode): HastNode => {
      if (
        node.type === 'element' &&
        node.tagName === 'pre' &&
        node.children?.[0]?.tagName === 'code'
      ) {
        const codeNode = node.children[0];
        const classes = Array.isArray(codeNode.properties?.className)
          ? (codeNode.properties?.className as string[])
          : [];

        const langClass = classes.find(
          (className) => typeof className === 'string' && className.startsWith('language-')
        );

        node.properties = node.properties || {};
        codeNode.properties = codeNode.properties || {};

        if (langClass) {
          const lang = langClass.replace('language-', '');

          node.properties.className = [`language-${lang}`];
          node.properties.style = 'background-color: transparent;';
          codeNode.properties.className = [`language-${lang}`, 'code-highlight'];

          if (!node.children.some((child) => child.tagName === 'div')) {
            node.children.push({
              type: 'element',
              tagName: 'div',
              properties: {},
              children: [],
            });
          }
        } else {
          node.properties.className = ['language-text'];
          node.properties.style = 'background-color: transparent;';
          codeNode.properties.className = ['language-text', 'code-highlight'];
        }
      }

      if (node.children) {
        node.children.forEach((child) => visit(child));
      }

      return node;
    };

    visit(tree);
  };
}

// ✅ DETECTA SE A FÓRMULA DEVE SER DISPLAY/BLOCO
function shouldUseDisplayMode(formula: string): boolean {
  return (
    formula.includes('\n') ||
    /\\begin\{(array|cases|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|matrix|aligned|gathered|alignedat)\}/.test(
      formula
    ) ||
    formula.includes('\\displaystyle')
  );
}

// ✅ NORMALIZA BARRAS, CASO VENHAM DUPLICADAS DE JSON/STRING
function normalizeLatexSlashes(formula: string): string {
  return formula.trim();
}
// ✅ FUNÇÃO PARA PROCESSAR FÓRMULAS KaTeX ENTRE CRASES
function processBacktickKaTeX(content: string): string {
  return content.replace(/`\$\$([\s\S]*?)\$\$`/g, (match: string, formula: string) => {
    try {
      const cleanFormula = normalizeLatexSlashes(formula);
      const displayMode = shouldUseDisplayMode(cleanFormula);

      const katexHTML = katex.renderToString(cleanFormula, {
        throwOnError: false,
        displayMode,
        strict: false,
        output: 'html',
      });

      if (displayMode) {
        return `<div class="math-display">${katexHTML}</div>`;
      }

      return `<span class="math-inline">${katexHTML}</span>`;
    } catch (error) {
      console.error('Erro ao renderizar KaTeX:', error);

      return `<span class="math-inline-error">Erro KaTeX: ${formula}</span>`;
    }
  });
}

// ✅ FUNÇÃO PARA ESCAPAR FÓRMULAS SEM CRASES
function escapeNonBacktickMath(content: string): string {
  const backtickMatches: string[] = [];

  let tempContent = content.replace(/`\$\$([\s\S]*?)\$\$`/g, (match: string) => {
    backtickMatches.push(match);
    return `__BACKTICK_FORMULA_${backtickMatches.length - 1}__`;
  });

  let escaped = tempContent.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (match: string, formula: string) => {
      return `$$${formula
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}$$`;
    }
  );

  escaped = escaped.replace(/\$([^\n$]+)\$/g, (match: string, formula: string) => {
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

// ✅ FUNÇÃO PRINCIPAL
export async function processMarkdown(content: string): Promise<string> {
  try {
    console.log('Processando Markdown...');

    // 1. Primeiro, processar fórmulas entre crases
    let processedContent = processBacktickKaTeX(content);

    // 2. Escapar fórmulas sem crases
    processedContent = escapeNonBacktickMath(processedContent);

    // 3. Processar blocos KaTeX especiais (```KaTeX)
    const katexBlocks: string[] = [];

    processedContent = processedContent.replace(
      /```KaTeX\s*\n([\s\S]*?)```/gi,
      (match: string, formula: string) => {
        try {
          const cleanFormula = normalizeLatexSlashes(formula);

          const katexHTML = katex.renderToString(cleanFormula, {
            throwOnError: false,
            displayMode: true,
            strict: false,
            output: 'html',
          });

          katexBlocks.push(katexHTML);

          return `\n\n<!-- KATEX_BLOCK_${katexBlocks.length - 1} -->\n\n`;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';

          katexBlocks.push(`<span style="color: red;">Erro KaTeX: ${message}</span>`);

          return `\n\n<!-- KATEX_BLOCK_${katexBlocks.length - 1} -->\n\n`;
        }
      }
    );

    // 4. PROCESSAMENTO UNIFIED
    console.log('Processando com unified...');

    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, {
        allowDangerousHtml: true,
      })
      .use(simpleCodeBlocks)
      .use(headingAnchors)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        allowDangerousCharacters: true,
      })
      .process(processedContent);

    let html = String(file);

    // 5. PÓS-PROCESSAMENTO

    // a) Restaurar blocos KaTeX especiais (```KaTeX)
    katexBlocks.forEach((block, index) => {
      html = html.replace(
        `<!-- KATEX_BLOCK_${index} -->`,
        `<div class="math-display katex-block">${block}</div>`
      );
    });

    // b) Processar imagens com container
    html = processImagesWithContainer(html);

    // c) NÃO corrigir classes internas do KaTeX.
    // Jamais trocar mathnormal/mathit/mathbb/mathrm manualmente.
    // O KaTeX precisa controlar suas próprias fontes.

    // d) Ajustar links para abrir em nova aba
    html = html.replace(
      /<a href="([^"]+)"(?![^>]*target=)/g,
      '<a target="_blank" rel="noopener noreferrer" href="$1"'
    );

    // e) Adicionar container final
    html = `
<div class="markdown-body wmde-markdown wmde-markdown-color"
     style="--color-canvas-default: transparent;
            --color-fg-default: currentColor;
            font-size: 0.875rem;
            line-height: 1.25rem;">
  ${html}
</div>`;

    console.log('Processamento completo!');

    return html;
  } catch (error) {
    console.error('Erro ao processar Markdown:', error);

    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    return `<div style="color: red; padding: 20px; border: 1px solid red;">
      <strong>Erro:</strong> ${message}
    </div>`;
  }
}
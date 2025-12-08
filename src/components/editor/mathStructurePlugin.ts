// mathScructurePlugins.ts
import { ViewPlugin, Decoration, type DecorationSet, EditorView, ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

export const mathStructurePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();

      for (let { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);

        // ⚠️ SOMENTE: `$$conteudo$$`
        const regex = /`(\$\$)([\s\S]*?)(\$\$)`/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
          const base = from + match.index;

          const backtickStart = base;           // `
          const openDollarStart = base + 1;     // $$
          const contentStart = openDollarStart + 2;
          const contentEnd = contentStart + match[2].length;
          const closeDollarStart = contentEnd;
          const backtickEnd = closeDollarStart + 2; // $$`

          // ✅ `$$ → delimitador
          builder.add(
            backtickStart,
            contentStart,
            Decoration.mark({ class: "cm-math-delimiter" })
          );

          // ✅ conteúdo
          builder.add(
            contentStart,
            contentEnd,
            Decoration.mark({ class: "cm-math-content" })
          );

          // ✅ $$` → delimitador
          builder.add(
            contentEnd,
            backtickEnd + 1,
            Decoration.mark({ class: "cm-math-delimiter" })
          );
        }
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations
  }
);

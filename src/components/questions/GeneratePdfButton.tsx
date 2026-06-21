"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Loader2 } from "lucide-react";
import {
  downloadListaPdf,
  type PdfFontSize,
  type PdfLayoutQuestoes,
} from "@/lib/questions/list";
import { usePathname } from "next/navigation";

interface GeneratePdfButtonProps {
  listaId: number;
  token: string;
  tituloLista?: string;
  subtituloLista?: string | null;
  courseTitle?: string;
  coverKind?: string;
  publicUrl?: string;
}

export default function GeneratePdfButton({
  listaId,
  token,
  tituloLista,
  subtituloLista,
  courseTitle,
  coverKind,
  publicUrl,
}: GeneratePdfButtonProps) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<PdfLayoutQuestoes>("colunas");
  const [fontSize, setFontSize] = useState<PdfFontSize>("M");
  const [showTopicos, setShowTopicos] = useState(true);
  const [showDificuldade, setShowDificuldade] = useState(false);
  const [showGabarito, setShowGabarito] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const pathname = usePathname();

  function sanitizePdfFileName(value: string) {
    return value
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function handleDownloadPdf() {
    if (!token || isGenerating) return;

    setIsGenerating(true);

    const pdfTitle = sanitizePdfFileName(
      `[Principia] ${tituloLista || `Lista ${listaId}`}`,
    );

    const publicUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${pathname}`
        : `https://app.principiamatematica.com${pathname}`;

    const success = await downloadListaPdf(listaId, token, {
      layoutQuestoes: layout,
      fontSize,
      showTopicos,
      showDificuldade,
      showGabarito,

      fileName: `${pdfTitle}.pdf`,

      url: publicUrl,
      titulo: tituloLista || `Lista ${listaId}`,
      subtitulo: subtituloLista || "Lista de exercícios",
      courseTitle: courseTitle || "Principia Matemática",
      coverKind: coverKind || "LISTA DE EXERCÍCIOS",
    });

    setIsGenerating(false);

    if (success) {
      setOpen(false);
    }
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-pink-700"
      >
        Gerar PDF da lista
        <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-pink-600">
          PDF
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-[498px] overflow-hidden rounded-b-md border border-slate-700/80 bg-[#020817] text-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-700/80 px-6 py-4">
                <div>
                  <h2 className="text-2xl font-semibold leading-none text-slate-100">
                    Gerar PDF
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    Defina as configurações do seu PDF e baixe o arquivo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isGenerating}
                  className="rounded-md p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Fechar"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-100">
                      Grid de Questão
                    </h3>

                    <span
                      title="Escolha se as questões ficarão em duas colunas ou em sequência vertical."
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-500/70 text-[11px] font-bold text-[#020817]"
                    >
                      ?
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => setLayout("colunas")}
                      disabled={isGenerating}
                      className={[
                        "grid h-[86px] w-[112px] grid-cols-2 overflow-hidden rounded border transition disabled:cursor-not-allowed disabled:opacity-70",
                        layout === "colunas"
                          ? "border-slate-300 bg-slate-500"
                          : "border-slate-700 bg-transparent hover:border-slate-500",
                      ].join(" ")}
                      aria-label="Layout em colunas"
                    >
                      <span className="border-r border-slate-300/80" />
                      <span />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLayout("sequencial")}
                      disabled={isGenerating}
                      className={[
                        "grid h-[86px] w-[112px] grid-rows-2 overflow-hidden rounded border transition disabled:cursor-not-allowed disabled:opacity-70",
                        layout === "sequencial"
                          ? "border-slate-300 bg-slate-500"
                          : "border-slate-700 bg-transparent hover:border-slate-500",
                      ].join(" ")}
                      aria-label="Layout sequencial"
                    >
                      <span className="border-b border-slate-500" />
                      <span />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-bold text-slate-100">
                    Tamanho da fonte
                  </h3>

                  <div className="inline-flex overflow-hidden rounded-md border border-slate-700">
                    {(["P", "M", "G"] as PdfFontSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFontSize(size)}
                        disabled={isGenerating}
                        className={[
                          "h-11 w-[52px] border-r border-slate-700 text-lg font-bold transition last:border-r-0 disabled:cursor-not-allowed disabled:opacity-70",
                          fontSize === size
                            ? "bg-slate-600 text-white"
                            : "bg-transparent text-slate-100 hover:bg-slate-800",
                        ].join(" ")}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <PdfSwitch
                    label="Exibir assunto da questão"
                    checked={showTopicos}
                    disabled={isGenerating}
                    onChange={setShowTopicos}
                  />

                  <PdfSwitch
                    label="Exibir dificuldade da questão"
                    checked={showDificuldade}
                    disabled={isGenerating}
                    onChange={setShowDificuldade}
                  />

                  <PdfSwitch
                    label="Exibir gabarito da lista"
                    checked={showGabarito}
                    disabled={isGenerating}
                    onChange={setShowGabarito}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGenerating || !token}
                  className="inline-flex items-center justify-center gap-2 rounded bg-pink-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Baixar PDF
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PdfSwitch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xl font-bold leading-tight text-slate-100">
        {label}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-6 w-[54px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-70",
          checked ? "bg-[#0e00d0]" : "bg-slate-600",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-[#020817] transition",
            checked ? "left-[33px]" : "left-[4px]",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

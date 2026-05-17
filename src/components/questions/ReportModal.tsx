// components/questions/ReportModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { inviteReport } from "@/lib/questions/report";

const motivos = [
  "Enunciado/alternativa errada",
  "Gabarito errado",
  "Disciplina ou assunto errado",
  "Questão anulada",
  "Questão desatualizada",
  "Questão duplicada",
];

interface ReportarModalProps {
  questaoId: number;
  onClose: () => void;
  token: string;
}

export default function ReportarModal({
  questaoId,
  onClose,
  token,
}: ReportarModalProps) {
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(motivo && descricao.trim().length >= 5 && !isSubmitting);
  }, [motivo, descricao, isSubmitting]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting && !showSuccess) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, showSuccess, onClose]);

  async function submit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError("");

    try {
      await inviteReport(
        {
          title: motivo,
          message: `Questão #${questaoId}: ${descricao.trim()}`,
          type: "questao_error",
        },
        token
      );

      setShowSuccess(true);

      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("Não foi possível enviar o reporte. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !isSubmitting && !showSuccess) {
      onClose();
    }
  }

  if (!questaoId) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-3 py-6 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0B1120] shadow-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0e00d0]/80 to-transparent" />

          {!showSuccess ? (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0e00d0]/15 text-[#6f66ff] ring-1 ring-[#0e00d0]/30">
                    <AlertTriangle className="h-4 w-4" />
                  </div>

                  <div>
                    <h2
                      id="report-modal-title"
                      className="text-base font-semibold tracking-tight text-white"
                    >
                      Reportar problema
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Questão #{questaoId}. Informe o erro com objetividade.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 px-5 py-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-[#0e00d0]/30 bg-[#0e00d0]/10 px-3 py-2 text-xs text-[#c7c3ff]"
                  >
                    {error}
                  </motion.div>
                )}

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Motivo
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {motivos.map((item) => {
                      const active = motivo === item;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setMotivo(item)}
                          disabled={isSubmitting}
                          className={[
                            "min-h-10 rounded-xl border px-3 py-2 text-left text-xs font-medium transition",
                            "disabled:pointer-events-none disabled:opacity-60",
                            active
                              ? "border-[#0e00d0]/80 bg-[#0e00d0]/15 text-white shadow-[0_0_0_1px_rgba(14,0,208,0.22)]"
                              : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#0e00d0]/70 hover:bg-[#0e00d0]/10 hover:text-white",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={[
                                "h-2 w-2 rounded-full",
                                active ? "bg-[#6f66ff]" : "bg-slate-600",
                              ].join(" ")}
                            />
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="report-description"
                      className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500"
                    >
                      Descrição
                    </label>

                    <span className="text-[11px] text-slate-500">
                      {descricao.length}/500
                    </span>
                  </div>

                  <textarea
                    id="report-description"
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    disabled={isSubmitting}
                    maxLength={500}
                    rows={4}
                    placeholder="Ex.: a alternativa correta deveria ser B, pois..."
                    className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-[#0e00d0]/70 focus:ring-2 focus:ring-[#0e00d0]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Mínimo de 5 caracteres para enviar.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e00d0] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#0e00d0]/25 transition hover:bg-[#0b009e] disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Enviando
                    </>
                  ) : (
                    "Enviar reporte"
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="px-6 py-8 text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18 }}
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25"
              >
                <CheckCircle2 className="h-6 w-6" />
              </motion.div>

              <h3 className="text-base font-semibold text-white">
                Reporte enviado
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Obrigado. A equipe analisará esta questão.
              </p>

              <div className="mx-auto mt-5 h-1 w-36 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.25, ease: "easeOut" }}
                  className="h-full rounded-full bg-emerald-400"
                />
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
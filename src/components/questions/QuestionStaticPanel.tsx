// components/questions/QuestionStaticPanel.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Hash,
  Loader2,
  PlayCircle,
  Tag,
} from "lucide-react";

import {
  getQuestionById,
  type SingleQuestion,
  type QuestionAlternative,
} from "@/lib/questions/question";

import { processMarkdown } from "@/utils/markdownProcessor";
import { markdownProcessorAlternativas } from "@/utils/markdownProcessorAlternativas";
import { ImageLightbox } from "@/components/editor/ImageLightbox";
import { PrincipiaQuestionBanner } from "./PrincipiaQuestionBanner";

type ProcessedQuestion = {
  enunciado: string;
  gabaritoComentado?: string;
  respostaEsperada?: string;
  criterioCorrecao?: string;
  alternativas: Record<number, string>;
};

type QuestionStaticPanelProps = {
  questionId: number;
};

function getDifficultyLabel(dificuldade?: number | null) {
  switch (Number(dificuldade)) {
    case 1:
      return "Muito fácil";
    case 2:
      return "Fácil";
    case 3:
      return "Médio";
    case 4:
      return "Difícil";
    case 5:
      return "Muito difícil";
    default:
      return "Não informada";
  }
}

function getTipoLabel(tipo?: string | null) {
  switch (tipo) {
    case "objetiva":
      return "Múltipla escolha";
    case "discursiva":
      return "Discursiva";
    case "resposta_numerica":
      return "Resposta numérica";
    case "certo_errado":
      return "Certo ou errado";
    default:
      return "Questão";
  }
}

function getDifficultyClass(dificuldade?: number | null) {
  switch (Number(dificuldade)) {
    case 1:
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case 2:
      return "border-lime-500/40 bg-lime-500/10 text-lime-300";
    case 3:
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
    case 4:
      return "border-orange-500/40 bg-orange-500/10 text-orange-300";
    case 5:
      return "border-red-500/40 bg-red-500/10 text-red-300";
    default:
      return "border-gray-500/30 bg-gray-500/10 text-gray-300";
  }
}

function isLikelyEmbeddableVideo(url: string) {
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    url.includes("pandavideo.com") ||
    url.includes("panda") ||
    url.includes("iframe")
  );
}

function getVideoEmbedUrl(url: string) {
  try {
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (url.includes("watch?v=")) {
      const id = new URL(url).searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    return url;
  } catch {
    return url;
  }
}

function MarkdownBlock({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "markdown-body wmde-markdown wmde-markdown-color max-w-none break-words",
        "[&_img]:my-4 [&_img]:max-h-[560px] [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-lg [&_img]:object-contain",
        "[&_p]:my-3 [&_ul]:my-3 [&_ol]:my-3",
        "[&_center]:my-4",
        className,
      ].join(" ")}
      style={
        {
          "--color-canvas-default": "transparent",
          "--color-fg-default": "currentColor",
        } as React.CSSProperties
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function MetadataPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-gray-300">
      <span className="shrink-0 text-blue-300">{icon}</span>
      <span className="shrink-0 font-semibold text-gray-400">{label}:</span>
      <span className="truncate font-bold text-white">{value}</span>
    </div>
  );
}

function StaticAlternative({
  alternativa,
  processedText,
}: {
  alternativa: QuestionAlternative;
  processedText?: string;
}) {
  return (
    <li className="group flex gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 transition hover:border-blue-500/40 hover:bg-blue-50 dark:border-gray-800 dark:bg-[#020617] dark:text-gray-100 dark:hover:bg-blue-950/20">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-xs font-black text-gray-700 dark:border-gray-700 dark:bg-[#111827] dark:text-gray-200">
        {alternativa.letra?.toUpperCase()}
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <MarkdownBlock
          html={processedText || alternativa.texto}
          className="text-sm leading-relaxed text-inherit"
        />
      </div>
    </li>
  );
}

function AuthorSignature() {
  return (
    <div className="mt-5 flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E00D0] text-white shadow-lg">
        <GraduationCap className="h-5 w-5" />
      </div>
    </div>
  );
}

export function QuestionStaticPanel({ questionId }: QuestionStaticPanelProps) {
  const [question, setQuestion] = useState<SingleQuestion | null>(null);
  const [processed, setProcessed] = useState<ProcessedQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const { data: session, status } = useSession();

  const sessionToken = useMemo(() => {
    return (
      (session as any)?.laravelToken ||
      (session as any)?.accessToken ||
      (session as any)?.user?.laravelToken ||
      ""
    );
  }, [session]);

  const token = useMemo(() => {
    return String(sessionToken)
      .replace(/^Bearer\s+/i, "")
      .trim();
  }, [sessionToken]);

  const sortedAlternativas = useMemo(() => {
    return [...(question?.alternativas ?? [])].sort((a, b) => {
      const ordemA = Number(a.ordem ?? 0);
      const ordemB = Number(b.ordem ?? 0);

      if (ordemA !== ordemB) return ordemA - ordemB;

      return String(a.letra ?? "").localeCompare(String(b.letra ?? ""));
    });
  }, [question?.alternativas]);

  const alternativaCorreta = useMemo(() => {
    if (!question?.alternativa_correta_id) return null;

    return (
      sortedAlternativas.find(
        (alt) => alt.id === question.alternativa_correta_id,
      ) ?? null
    );
  }, [question?.alternativa_correta_id, sortedAlternativas]);

  const provaLabel = useMemo(() => {
    if (!question?.prova) return "Prova não informada";

    return [
      question.prova.sigla || question.prova.nome,
      question.prova.ano ? String(question.prova.ano) : null,
    ]
      .filter(Boolean)
      .join(" • ");
  }, [question?.prova]);

  const bancaLabel = useMemo(() => {
    return (
      question?.prova?.banca?.sigla ||
      question?.prova?.banca?.nome ||
      "Banca não informada"
    );
  }, [question?.prova?.banca]);

  const frenteLabel = useMemo(() => {
    return (
      question?.topicos?.[0]?.assunto?.frente?.nome ||
      question?.topicos?.[0]?.assunto?.nome ||
      "Matemática"
    );
  }, [question?.topicos]);

  const carregarQuestao = useCallback(async () => {
    if (status === "loading") return;

    setLoading(true);
    setError(null);

    try {
      const data = await getQuestionById(questionId, token);
      setQuestion(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar esta questão.");
    } finally {
      setLoading(false);
    }
  }, [questionId, token, status]);

  useEffect(() => {
    carregarQuestao();
  }, [carregarQuestao]);

  useEffect(() => {
    if (!question) return;

    const currentQuestion = question;
    let cancelled = false;

    async function processar() {
      setProcessing(true);

      try {
        const alternativasProcessadas: Record<number, string> = {};

        for (const alternativa of currentQuestion.alternativas ?? []) {
          alternativasProcessadas[alternativa.id] =
            await markdownProcessorAlternativas(alternativa.texto ?? "");
        }

        const result: ProcessedQuestion = {
          enunciado: await processMarkdown(currentQuestion.enunciado ?? ""),
          gabaritoComentado: currentQuestion.gabarito_comentado_texto
            ? await processMarkdown(currentQuestion.gabarito_comentado_texto)
            : undefined,
          respostaEsperada: currentQuestion.resposta_esperada
            ? await processMarkdown(currentQuestion.resposta_esperada)
            : undefined,
          criterioCorrecao: currentQuestion.criterio_correcao
            ? await processMarkdown(currentQuestion.criterio_correcao)
            : undefined,
          alternativas: alternativasProcessadas,
        };

        if (!cancelled) {
          setProcessed(result);
        }
      } catch (err) {
        console.error("Erro ao processar markdown da questão:", err);

        if (!cancelled) {
          setProcessed({
            enunciado: currentQuestion.enunciado ?? "",
            gabaritoComentado:
              currentQuestion.gabarito_comentado_texto ?? undefined,
            respostaEsperada: currentQuestion.resposta_esperada ?? undefined,
            criterioCorrecao: currentQuestion.criterio_correcao ?? undefined,
            alternativas: Object.fromEntries(
              (currentQuestion.alternativas ?? []).map((alt) => [
                alt.id,
                alt.texto,
              ]),
            ),
          });
        }
      } finally {
        if (!cancelled) {
          setProcessing(false);
        }
      }
    }

    processar();

    return () => {
      cancelled = true;
    };
  }, [question]);

  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.tagName !== "IMG") return;

      const isInQuestionContent =
        target.closest(".markdown-body") ||
        target.closest('[data-question-static="true"]');

      if (!isInQuestionContent) return;

      const src = target.getAttribute("src");

      if (!src) return;

      setZoomedImageUrl(src);
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("click", handleImageClick, true);

    return () => {
      document.removeEventListener("click", handleImageClick, true);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F6F6F6] px-4 dark:bg-[#00091A]">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-gray-700 shadow-xl dark:border-gray-800 dark:bg-[#020617] dark:text-gray-200">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm font-semibold">Carregando questão...</span>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F6F6F6] px-4 dark:bg-[#00091A]">
        <div className="w-full max-w-2xl rounded-xl border border-red-500/30 bg-red-950/30 p-6 text-red-100 shadow-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

            <div>
              <h1 className="text-lg font-black">Questão não encontrada</h1>
              <p className="mt-1 text-sm text-red-100/80">
                {error ?? "Não foi possível localizar a questão solicitada."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-question-static="true"
      className="min-h-screen bg-[#F6F6F6] text-gray-900 dark:bg-[#00091A] dark:text-white"
    >
      <div className="border-b border-gray-200 bg-white dark:border-gray-900 dark:bg-[#020617]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <nav className="flex flex-wrap items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Link
              href="/exercicios"
              className="transition hover:text-[#0E00D0] dark:hover:text-blue-300"
            >
              Exercícios
            </Link>

            <ChevronRight className="h-3.5 w-3.5" />

            <span>{question.prova?.ano ?? "Ano"}</span>

            <ChevronRight className="h-3.5 w-3.5" />

            <span className="truncate">
              {question.prova?.sigla || question.prova?.nome || "Prova"}
            </span>

            <ChevronRight className="h-3.5 w-3.5" />

            <span className="text-gray-800 dark:text-gray-200">
              Questão #{question.id}
            </span>
          </nav>
        </div>
      </div>

      <section className="bg-[#071226]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-5 flex flex-wrap gap-2">
            <MetadataPill
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Prova"
              value={provaLabel}
            />

            <MetadataPill
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label="Banca"
              value={bancaLabel}
            />

            <MetadataPill
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label="Tipo"
              value={getTipoLabel(question.tipo)}
            />
          </div>

          <div className="max-w-5xl">
            <h1 className="mt-3 text-2xl font-black leading-tight text-white sm:text-4xl">
              Questão #{question.id}
              {question.prova?.sigla ? ` • ${question.prova.sigla}` : ""}
              {question.prova?.ano ? ` ${question.prova.ano}` : ""}
            </h1>

            <div className="mt-5 max-w-4xl">
              {processing && (
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/30 px-3 py-1 text-xs font-bold text-blue-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processando
                </div>
              )}

              <MarkdownBlock
                html={processed?.enunciado || question.enunciado}
                className="text-[0.95rem] leading-7 text-gray-200 sm:text-base sm:leading-8"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-black",
                getDifficultyClass(question.dificuldade),
              ].join(" ")}
            >
              {getDifficultyLabel(question.dificuldade)}
            </span>

            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-200">
              {frenteLabel}
            </span>

            {question.tempo_resolucao ? (
              <span className="rounded-full border border-gray-500/30 bg-white/5 px-3 py-1 text-xs font-black text-gray-300">
                {question.tempo_resolucao} min
              </span>
            ) : null}

            {question.adaptado ? (
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-black text-purple-200">
                Adaptada
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="my-6">
          <PrincipiaQuestionBanner />
        </div>

        {!!sortedAlternativas.length && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-[#020617] sm:p-8">
            <div className="mb-5">
              <h2 className="text-xl font-black text-gray-950 dark:text-white">
                Alternativas
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Leia as opções abaixo e confira o gabarito na sequência.
              </p>
            </div>

            <ol className="space-y-3">
              {sortedAlternativas.map((alternativa) => (
                <StaticAlternative
                  key={alternativa.id}
                  alternativa={alternativa}
                  processedText={processed?.alternativas[alternativa.id]}
                />
              ))}
            </ol>
          </section>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-[#020617] sm:p-6">
            <h2 className="text-lg font-black text-gray-950 dark:text-white">
              Gabarito da questão
            </h2>

            <div className="mt-4 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
              {alternativaCorreta ? (
                <>
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />

                    <p className="text-sm font-black uppercase tracking-widest">
                      Opção {alternativaCorreta.letra?.toUpperCase()}
                    </p>
                  </div>

                  <div className="mt-3 text-green-950 dark:text-green-50">
                    <MarkdownBlock
                      html={
                        processed?.alternativas[alternativaCorreta.id] ||
                        alternativaCorreta.texto
                      }
                      className="text-sm leading-relaxed"
                    />
                  </div>
                </>
              ) : question.resposta_numerica ? (
                <p className="text-sm font-black text-green-700 dark:text-green-300">
                  Resposta numérica: {question.resposta_numerica}
                </p>
              ) : question.gabarito_certo_errado ? (
                <p className="text-sm font-black text-green-700 dark:text-green-300">
                  {question.gabarito_certo_errado.toUpperCase()}
                </p>
              ) : question.resposta_esperada ? (
                <MarkdownBlock
                  html={
                    processed?.respostaEsperada || question.resposta_esperada
                  }
                  className="text-sm leading-relaxed text-green-950 dark:text-green-50"
                />
              ) : (
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-200">
                  Gabarito ainda não informado.
                </p>
              )}
            </div>

            <div className="mt-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-blue-500" />
                <span>Questão #{question.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-500" />
                <span>{getTipoLabel(question.tipo)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-[#020617] sm:p-6">
            <h2 className="text-lg font-black text-gray-950 dark:text-white">
              Tópicos correspondentes
            </h2>

            {!!question.topicos?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {question.topicos.map((topico) => (
                  <span
                    key={topico.id}
                    className="rounded-full border border-blue-500/30 bg-blue-100 px-3 py-1.5 text-xs font-black text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                    title={[
                      topico.assunto?.frente?.nome,
                      topico.assunto?.nome,
                      topico.nome,
                    ]
                      .filter(Boolean)
                      .join(" > ")}
                  >
                    {topico.assunto?.frente?.nome
                      ? `${topico.assunto.frente.nome} • `
                      : ""}
                    {topico.nome}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Nenhum tópico vinculado.
              </p>
            )}

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#00091A]">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Origem
              </p>

              <p className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                {question.adaptado ? "Questão adaptada" : "Questão original"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-[#020617] sm:p-8">
          <h2 className="text-xl font-black text-gray-950 dark:text-white">
            Comentário da questão
          </h2>

          {question.gabarito_video && (
            <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-black shadow-xl dark:border-gray-800">
              {isLikelyEmbeddableVideo(question.gabarito_video) ? (
                <iframe
                  src={getVideoEmbedUrl(question.gabarito_video)}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`Resolução em vídeo da questão ${question.id}`}
                />
              ) : (
                <video
                  src={question.gabarito_video}
                  controls
                  className="aspect-video w-full bg-black"
                />
              )}
            </div>
          )}

          {question.gabarito_comentado_texto ? (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#00091A]">
              <MarkdownBlock
                html={
                  processed?.gabaritoComentado ||
                  question.gabarito_comentado_texto
                }
                className="text-[0.95rem] leading-7 text-gray-800 dark:text-gray-200 sm:text-base sm:leading-8"
              />
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm font-semibold text-yellow-800 dark:text-yellow-100">
              Resolução textual ainda não informada.
            </div>
          )}

          {question.criterio_correcao && (
            <div className="mt-5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
              <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-200">
                Critério de correção
              </h3>

              <MarkdownBlock
                html={processed?.criterioCorrecao || question.criterio_correcao}
                className="text-sm leading-relaxed text-blue-950 dark:text-blue-50"
              />
            </div>
          )}

          <AuthorSignature />
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-[#0E00D0]/40 bg-[#071226] shadow-xl">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
                Continue estudando
              </p>

              <h2 className="mt-2 max-w-2xl text-lg font-black text-white">
                Resolva outras questões do mesmo assunto e consolide este
                raciocínio.
              </h2>
            </div>

            <Link
              href="/exercicios"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-[#0E00D0] transition hover:bg-blue-50"
            >
              <PlayCircle className="h-4 w-4" />
              Ir para exercícios
            </Link>
          </div>
        </section>
      </main>

      {zoomedImageUrl && (
        <ImageLightbox
          imageUrl={zoomedImageUrl}
          onClose={() => setZoomedImageUrl(null)}
        />
      )}
    </div>
  );
}
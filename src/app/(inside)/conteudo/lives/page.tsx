"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getLives, type Live } from "@/lib/lives/lives";
import { slugify } from "@/lib/slug";

// Hook personalizado de debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Ícones otimizados
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.2 16.2 21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

// Skeleton melhorado
function LiveCardSkeleton() {
  return (
    <div className="block animate-pulse">
      <div className="relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
        <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-white/5 to-white/10">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
      </div>
      
      <div className="mt-4 px-2 space-y-3">
        <div className="h-5 bg-white/10 rounded-md w-3/4"></div>
        <div className="h-4 bg-white/10 rounded-md w-1/2"></div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-4 bg-white/10 rounded"></div>
          <div className="h-3 bg-white/10 rounded-md w-24"></div>
        </div>
      </div>
    </div>
  );
}

function LiveCard({ live }: { live: Live }) {
  const thumb = live.thumb || "/thumb-principia.png";
  const slug = slugify(live.title);
  const formattedDate = live.starts_at 
    ? new Date(live.starts_at).toLocaleDateString("pt-BR", {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace('.', '')
    : null;

  return (
    <Link
      href={`/conteudo/lives/${live.id}/${slug}`}
      className={[
        "group block text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1",
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-white/5 to-white/5",
          "ring-1 ring-white/10",
          "shadow-lg shadow-black/20",
          "group-hover:shadow-xl group-hover:shadow-black/30 group-hover:ring-white/20",
          "transition-all duration-300 ease-out",
        ].join(" ")}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={thumb}
            alt=""
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            priority={false}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>

      <div className="mt-4 px-2">
        <h3 className="text-base leading-tight font-medium text-white/80 line-clamp-2 group-hover:text-white/90 transition-colors">
          {live.title}
        </h3>

        {formattedDate && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
            <CalendarIcon />
            <span className="tracking-tight">{formattedDate}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function AulasSemanaisPage() {
  const { data: session, status } = useSession();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  // Usando nosso hook personalizado de debounce
  const debouncedSearch = useDebounce(search, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const clearSearch = () => {
    setSearch("");
  };

  useEffect(() => {
    const token = (session as any)?.laravelToken;

    if (status === "loading") return;

    if (!token) {
      setLoading(false);
      setLives([]);
      setErrorMsg("Sessão não encontrada. Faça login novamente.");
      return;
    }

    let cancelled = false;

    const fetchLives = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const data = await getLives(token);
        if (!cancelled) setLives(data);
      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(e.message || "Erro ao carregar as aulas. Tente novamente.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLives();

    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const filteredLives = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return lives;
    return lives.filter((l) => 
      l.title?.toLowerCase().includes(q) || 
      l.description?.toLowerCase().includes(q)
    );
  }, [lives, debouncedSearch]);

  const resultCount = filteredLives.length;
  const showNoResults = !loading && !errorMsg && resultCount === 0 && debouncedSearch;

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#030712] to-[#0a1020]">
      {/* Gradientes sutis de fundo */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(26,65,155,0.08),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(16,67,140,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white/90">
            Aulas Semanais
          </h1>
          <p className="mt-3 text-white/40 text-base">
            Acompanhe nossas transmissões ao vivo
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center mb-16">
          <div className="w-full max-w-2xl">
            <div className="relative">
              <div className="relative flex items-center h-12 bg-[#0e1628]/80 backdrop-blur-sm rounded-xl ring-1 ring-white/10 focus-within:ring-blue-500/30 transition-all">
                <SearchIcon className="absolute left-4 h-4 w-4 text-white/30" />
                <input
                  type="search"
                  placeholder="Buscar aulas por título ou descrição..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full h-full bg-transparent pl-10 pr-20 text-white/80 placeholder:text-white/25 text-sm outline-none"
                />
                {search && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 text-white/25 hover:text-white/50 transition-colors text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {/* Result count */}
            {!loading && !errorMsg && lives.length > 0 && (
              <div className="mt-2 text-xs text-white/30 px-4">
                {resultCount} {resultCount === 1 ? 'aula encontrada' : 'aulas encontradas'}
                {debouncedSearch && ` para "${debouncedSearch}"`}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="rounded-xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3">
              <p className="text-red-200/80 text-sm text-center">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <section className="mt-8">
          {loading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <LiveCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredLives.map((live) => (
                  <LiveCard key={live.id} live={live} />
                ))}
              </div>

              {showNoResults && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3 opacity-20">🔍</div>
                  <p className="text-white/30 text-base">
                    Nenhuma aula encontrada para "{debouncedSearch}"
                  </p>
                  <button
                    onClick={clearSearch}
                    className="mt-3 text-blue-400/70 hover:text-blue-400 text-xs transition-colors"
                  >
                    Limpar busca
                  </button>
                </div>
              )}

              {!loading && !errorMsg && lives.length === 0 && !debouncedSearch && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3 opacity-20">📺</div>
                  <p className="text-white/30 text-base">
                    Nenhuma aula disponível no momento
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
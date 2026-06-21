"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Flame,
  Zap,
  Rocket,
  Megaphone,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wrench,
} from "lucide-react";
import {
  getActivePlatformAnnouncement,
  type PlatformAnnouncement,
} from "@/lib/platformAnnouncements";
import { useSession } from "next-auth/react";

type VariantStyle = {
  wrapper: string;
  glow: string;
  iconBox: string;
  badge: string;
  cta: string;
  Icon: React.ElementType;
};




const variantStyles: Record<string, VariantStyle> = {
  vibrant: {
    wrapper:
      "border-fuchsia-400/30 bg-[radial-gradient(circle_at_10%_20%,rgba(255,0,128,0.95),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(14,0,208,0.95),transparent_30%),linear-gradient(90deg,#040015,#180036,#0E00D0)] text-white",
    glow: "shadow-[0_18px_50px_rgba(255,0,128,0.28)]",
    iconBox:
      "border-white/20 bg-white/15 text-fuchsia-100 shadow-[0_0_24px_rgba(255,255,255,0.22)]",
    badge:
      "border-fuchsia-200/30 bg-fuchsia-300/20 text-fuchsia-50 shadow-[0_0_18px_rgba(255,0,128,0.28)]",
    cta: "bg-white text-[#0E00D0] hover:bg-fuchsia-50",
    Icon: Sparkles,
  },

  warning: {
    wrapper:
      "border-amber-300/40 bg-[radial-gradient(circle_at_15%_15%,rgba(251,191,36,0.95),transparent_28%),linear-gradient(90deg,#1f1300,#6b3600,#dc2626)] text-white",
    glow: "shadow-[0_18px_50px_rgba(251,146,60,0.26)]",
    iconBox: "border-amber-100/25 bg-amber-200/20 text-amber-50",
    badge: "border-amber-100/30 bg-amber-200/20 text-amber-50",
    cta: "bg-white text-amber-700 hover:bg-amber-50",
    Icon: AlertTriangle,
  },

  success: {
    wrapper:
      "border-emerald-300/30 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.95),transparent_30%),linear-gradient(90deg,#001a12,#064e3b,#0E00D0)] text-white",
    glow: "shadow-[0_18px_50px_rgba(16,185,129,0.24)]",
    iconBox: "border-emerald-100/25 bg-emerald-200/20 text-emerald-50",
    badge: "border-emerald-100/30 bg-emerald-200/20 text-emerald-50",
    cta: "bg-white text-emerald-700 hover:bg-emerald-50",
    Icon: CheckCircle2,
  },

  info: {
    wrapper:
      "border-blue-300/30 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.95),transparent_30%),linear-gradient(90deg,#020617,#082f49,#0E00D0)] text-white",
    glow: "shadow-[0_18px_50px_rgba(56,189,248,0.22)]",
    iconBox: "border-sky-100/25 bg-sky-200/20 text-sky-50",
    badge: "border-sky-100/30 bg-sky-200/20 text-sky-50",
    cta: "bg-white text-sky-700 hover:bg-sky-50",
    Icon: Info,
  },

  maintenance: {
    wrapper:
      "border-purple-300/30 bg-[radial-gradient(circle_at_15%_10%,rgba(168,85,247,0.95),transparent_28%),linear-gradient(90deg,#12001f,#3b0764,#0E00D0)] text-white",
    glow: "shadow-[0_18px_50px_rgba(168,85,247,0.25)]",
    iconBox: "border-purple-100/25 bg-purple-200/20 text-purple-50",
    badge: "border-purple-100/30 bg-purple-200/20 text-purple-50",
    cta: "bg-white text-purple-700 hover:bg-purple-50",
    Icon: Wrench,
  },
};

function getVariantStyle(variant?: string | null) {
  return variantStyles[variant || "vibrant"] ?? variantStyles.vibrant;
}


export function DynamicTopFolder() {
  const router = useRouter();
  const pathname = usePathname();

  const [announcement, setAnnouncement] =
    useState<PlatformAnnouncement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const storageKey = useMemo(() => {
    if (!announcement?.id) return null;

    return `principia:closed-announcement:${announcement.id}`;
  }, [announcement?.id]);


  const { data: session } = useSession();

const userToken =
  (session as any)?.laravelToken ||
  (session as any)?.accessToken ||
  "";


useEffect(() => {
  if (!userToken) {
    setAnnouncement(null);
    setIsVisible(false);
    setIsLoading(false);
    return;
  }

  let cancelled = false;

  async function loadAnnouncement() {
    try {
      const data = await getActivePlatformAnnouncement(userToken);

      if (cancelled) return;

      setAnnouncement(data);

      if (!data) {
        setIsVisible(false);
        return;
      }

      const key = `principia:closed-announcement:${data.id}`;
      const wasClosed = window.localStorage.getItem(key);

      setIsVisible(!wasClosed);
    } catch (error) {
      console.error("Erro ao carregar comunicado da plataforma:", error);

      if (!cancelled) {
        setAnnouncement(null);
        setIsVisible(false);
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }

  loadAnnouncement();

  return () => {
    cancelled = true;
  };
}, [userToken]);

  const handleClose = () => {
    if (storageKey) {
      window.localStorage.setItem(storageKey, "1");
    }

    setIsVisible(false);
  };

  const handleNavigate = () => {
    const href = announcement?.cta_url;

    if (!href) return;

    if (href !== pathname) {
      router.push(href);
    }
  };

  if (isLoading || !announcement || !isVisible) {
    return null;
  }

  const style = getVariantStyle(announcement.variant);
  const Icon = style.Icon;

  return (
    <section
      className={[
        "relative z-40 overflow-hidden border-b",
        style.wrapper,
        style.glow,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[8%] top-[-30px] h-24 w-24 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute right-[18%] top-[-40px] h-28 w-28 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="absolute bottom-[-70px] left-[45%] h-32 w-32 rounded-full bg-blue-300/25 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.10)_45%,transparent_70%)]" />

      <div className="relative mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div
            className={[
              "hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border backdrop-blur sm:flex",
              style.iconBox,
            ].join(" ")}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {announcement.eyebrow ? (
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur",
                    style.badge,
                  ].join(" ")}
                >
                  <Zap className="h-3 w-3" />
                  {announcement.eyebrow}
                </span>
              ) : null}

              <span className="hidden rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur md:inline-flex">
                Principia
              </span>
            </div>

            <h2 className="line-clamp-1 text-base font-black leading-tight text-white drop-shadow-sm sm:text-lg lg:text-xl">
              {announcement.title}
            </h2>

            {announcement.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-white/82 sm:text-sm">
                {announcement.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {announcement.cta_url && announcement.cta_label ? (
            <button
              type="button"
              onClick={handleNavigate}
              className={[
                "hidden items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black shadow-xl transition hover:scale-[1.02] active:scale-[0.98] sm:inline-flex",
                style.cta,
              ].join(" ")}
            >
              <Rocket className="h-4 w-4" />
              {announcement.cta_label}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}

          {announcement.is_dismissible ? (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar comunicado"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur transition hover:bg-white/20 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {announcement.cta_url && announcement.cta_label ? (
        <button
          type="button"
          onClick={handleNavigate}
          className="relative flex w-full items-center justify-center gap-1 border-t border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/15 sm:hidden"
        >
          <Rocket className="h-3.5 w-3.5" />
          {announcement.cta_label}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </section>
  );
}
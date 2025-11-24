'use client';

import { ReactNode, useEffect, useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { NavBarComponent } from "@/components/NavBarComponent/NavBarComponent";
import { useProgressBar } from "@/components/Context/ProgressBarContext";
import { getUser } from '@/lib/dailyCheck/daily';
import { StreakProvider } from '@/contexts/StreakContext';

interface InsideLayoutProps {
  children: ReactNode;
  pageTitle?: string; // título opcional por página
}

export default function InsideLayout({ children, pageTitle }: InsideLayoutProps) {
  const { data: session, status, update } = useSession(); 
  const { done } = useProgressBar();
  const [lastSyncedAvatar, setLastSyncedAvatar] = useState<string | null>(null);

  // 🔒 Desativar console em produção
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.info = () => {};
      console.debug = () => {};
    }
  }, []);

  // ✅ Marca progresso quando sessão está pronta
  useEffect(() => {
    if (status !== "loading") {
      done();
    }
  }, [status, done]);

  // 🔥 Sincronização de avatar com backend
  useEffect(() => {
    const syncImageWithBackend = async () => {
      const sessionAny = session as any;

      if (status === "authenticated" && sessionAny?.laravelToken) {
        try {
          const profile = await getUser(sessionAny.laravelToken);
          const backendAvatar = profile?.avatar || null;
          const currentSessionImage = session?.user?.image || null;

          if (backendAvatar !== currentSessionImage && backendAvatar !== lastSyncedAvatar) {
            await update({
              ...session,
              user: {
                ...session?.user,
                image: backendAvatar,
              },
            });
            setLastSyncedAvatar(backendAvatar);
          }
        } catch (error) {
          // console.error está desativado em produção
          console.error("Erro ao sincronizar imagem:", error);
        }
      }
    };

    syncImageWithBackend();
  }, [status, session?.user?.image, lastSyncedAvatar, session, update]);

  if (status === "loading" || status === "unauthenticated") {
    return null; // fallback visual
  }

  return (
    <StreakProvider>
      <Head>
        <title>{pageTitle || "Meu App"}</title>
      </Head>

      <div className="min-h-screen bg-[#F6F6F6] dark:bg-[#00091A] dark:text-white flex flex-col w-full overflow-hidden">
        <NavBarComponent />
        <main className="flex-1 w-full overflow-hidden">
          {children}
        </main>
      </div>
    </StreakProvider>
  );
}

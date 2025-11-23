"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { NavBarComponent } from "@/components/NavBarComponent/NavBarComponent";
import { useProgressBar } from "@/components/Context/ProgressBarContext";
import { getUser } from '@/lib/dailyCheck/daily'
import { StreakProvider } from '@/contexts/StreakContext' // 👈 Importar o Provider

export default function InsideLayout({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession(); 
  const { done } = useProgressBar();
  const [lastSyncedAvatar, setLastSyncedAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "loading") {
      done();
    }
  }, [status, done]);

  // 🔥 LÓGICA CORRIGIDA DE SINCRONIZAÇÃO 🔥
  useEffect(() => {
    const syncImageWithBackend = async () => {
      const sessionAny = session as any;
      console.log(session);
      
      // Só roda se estiver autenticado e tiver o token
      if (status === "authenticated" && sessionAny?.laravelToken) {
        try {
          // 1. Busca o perfil no backend
          const profile = await getUser(sessionAny.laravelToken);
          const backendAvatar = profile?.avatar || null;
          
          // 2. VERIFICAÇÃO MAIS ROBUSTA:
          // - Evita loops comparando com o último valor sincronizado
          // - Só atualiza se realmente houver mudança
          const currentSessionImage = session?.user?.image || null;
          
          // Se o backend mudou E é diferente do que já temos na session
          if (backendAvatar !== currentSessionImage && backendAvatar !== lastSyncedAvatar) {
            console.log("Layout: Sincronizando imagem da sessão...", {
              backend: backendAvatar,
              session: currentSessionImage,
              lastSynced: lastSyncedAvatar
            });
            
            await update({
              ...session,
              user: {
                ...session?.user,
                image: backendAvatar,
              },
            });

            // Atualiza o último valor sincronizado
            setLastSyncedAvatar(backendAvatar);
          }
        } catch (error) {
          console.error("Layout: Erro ao sincronizar imagem:", error);
        }
      }
    };

    syncImageWithBackend();
    
  }, [status, session?.user?.image, lastSyncedAvatar, session, update]);

  // Se está carregando, retorna null (ou um loading global se preferir)
  if (status === "loading") {
    return null;
  }

  // Como você já tem middleware, essa verificação visual é apenas um fallback rápido
  // para não piscar a tela antes do middleware chutar
  if (status === "unauthenticated") {
    return null; 
  }

  return (
    // 👈 Envolver com StreakProvider
    <StreakProvider>
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-[#00091A] dark:text-white flex flex-col w-full overflow-hidden">
        <NavBarComponent />
        <main className="flex-1 w-full overflow-hidden">
          {children}
        </main>
      </div>
    </StreakProvider>
  );
}
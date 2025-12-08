// src/components/NavBarWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useProgressBar } from "@/components/Context/ProgressBarContext";
import { getUser } from '@/lib/dailyCheck/daily';
import { NavBarComponent } from "@/components/NavBarComponent/NavBarComponent";

export default function NavBarWrapper() {
  const { data: session, status, update } = useSession(); 
  const { done } = useProgressBar();
  const [lastSyncedAvatar, setLastSyncedAvatar] = useState<string | null>(null);

  // Marca progresso quando sessão está pronta
  useEffect(() => {
    if (status !== "loading") done();
  }, [status, done]);

  // Sincronização de avatar
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
          console.error("Erro ao sincronizar imagem:", error);
        }
      }
    };
    syncImageWithBackend();
  }, [status, session?.user?.image, lastSyncedAvatar, session, update]);

  if (status === "loading" || status === "unauthenticated") return null;

  return <NavBarComponent />;
}

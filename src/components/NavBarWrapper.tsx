// src/components/NavBarWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useProgressBar } from "@/components/Context/ProgressBarContext";
import { getUser } from "@/lib/dailyCheck/daily";
import { NavBarComponent } from "@/components/NavBarComponent/NavBarComponent";

export default function NavBarWrapper() {
  const { data: session, status, update } = useSession();
  const { done } = useProgressBar();

  const [lastSyncedAvatar, setLastSyncedAvatar] = useState<string | null>(null);
  const [lastSyncedUserId, setLastSyncedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "loading") done();
  }, [status, done]);

  useEffect(() => {
    const syncUserWithBackend = async () => {
      const sessionAny = session as any;

      if (status !== "authenticated" || !sessionAny?.laravelToken) {
        return;
      }

      try {
        const profile = await getUser(sessionAny.laravelToken);

        const backendAvatar = profile?.avatar || null;
        const backendUserId = profile?.id ? String(profile.id) : null;

        const currentSessionImage = session?.user?.image || null;
        const currentSessionUserId = sessionAny?.user?.id
          ? String(sessionAny.user.id)
          : null;

        const shouldSyncAvatar =
          backendAvatar !== currentSessionImage &&
          backendAvatar !== lastSyncedAvatar;

        const shouldSyncUserId =
          backendUserId &&
          backendUserId !== currentSessionUserId &&
          backendUserId !== lastSyncedUserId;

        if (shouldSyncAvatar || shouldSyncUserId) {
          await update({
            ...session,
            user: {
              ...session?.user,
              id: backendUserId ?? currentSessionUserId,
              image: backendAvatar,
            },
          });

          if (shouldSyncAvatar) {
            setLastSyncedAvatar(backendAvatar);
          }

          if (shouldSyncUserId) {
            setLastSyncedUserId(backendUserId);
          }
        }
      } catch (error) {
        console.error("Erro ao sincronizar usuário:", error);
      }
    };

    syncUserWithBackend();
  }, [
    status,
    session,
    session?.user?.image,
    lastSyncedAvatar,
    lastSyncedUserId,
    update,
  ]);

  if (status === "loading" || status === "unauthenticated") return null;

  return <NavBarComponent />;
}
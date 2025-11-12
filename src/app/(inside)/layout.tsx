"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NavBarComponent } from "@/components/NavBarComponent/NavBarComponent";
import { useProgressBar } from "@/components/Context/ProgressBarContext";

export default function InsideLayout({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const { done } = useProgressBar();

  // Quando a sessão for carregada, marcamos progresso como concluído
  useEffect(() => {
    if (status !== "loading") {
      done();
    }
  }, [status, done]);

  // Se ainda está carregando sessão, mostra nada (loading.tsx cuida)
  if (status === "loading") {
    return null;
  }

  // Se não estiver autenticado, redireciona para login
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#00091A] dark:text-white flex flex-col w-full overflow-hidden">
      <NavBarComponent />
      <main className="flex-1 w-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}

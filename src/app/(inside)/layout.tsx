// src/app/(inside)/layout.tsx
import { ReactNode } from "react";
import type { Metadata } from "next";
import { StreakProvider } from "@/contexts/StreakContext";
import NavBarWrapper from "@/components/NavBarWrapper";

export const metadata: Metadata = {
  title: {
    default: "Principia Matemática",
    template: "%s | Principia Matemática",
  },
  description:
    "Plataforma de estudos, questões, listas, aulas e acompanhamento de progresso.",
};

interface InsideLayoutProps {
  children: ReactNode;
}

export default function InsideLayout({ children }: InsideLayoutProps) {
  return (
    <StreakProvider>
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-[#00091A] dark:text-white flex flex-col w-full overflow-hidden">
        <NavBarWrapper />
        <main className="flex-1 w-full overflow-hidden">{children}</main>
      </div>
    </StreakProvider>
  );
}
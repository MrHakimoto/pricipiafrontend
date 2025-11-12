// src/components/ClientHomeLayout.tsx
"use client";

import { ProgressBarProvider } from "@/components/Context/ProgressBarContext";
import DashboardShell from "@/components/DashboardShell";

interface Props {
  children: React.ReactNode;
  session: any; // ou tipar com `Session` se estiver usando next-auth types
}

export default function ClientHomeLayout({ children, session }: Props) {
  return (
    <ProgressBarProvider>
      <DashboardShell session={session}>
        {children}
      </DashboardShell>
    </ProgressBarProvider>
  );
}

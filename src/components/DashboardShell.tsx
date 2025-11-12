"use client";

import { ReactNode } from "react";
import { NavBarComponent } from "@/components/NavBarComponent/NavBarComponent";

export default function DashboardShell({
  session,
  children,
}: {
  session: any;
  children: ReactNode;
}) {
  return (
    <div>
      <NavBarComponent />
      <main className="bg-[#030B1A] min-h-screen text-white px-4 pt-6">
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

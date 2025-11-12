"use client";

import { api } from "@/lib/axios";
import { signOut } from "next-auth/react";


export default function LogoutButton({ laravelToken }: { laravelToken: string }) {
  const handleLogout = async () => {
    try {
        await api.post('/logout', {}, {
        headers: {
          Authorization: `Bearer ${laravelToken}`,
        },
      });

      signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Erro ao sair:", error);
      signOut({ callbackUrl: "/login" }); // Garante logout mesmo se falhar
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-2 text-sm text-red-500 underline hover:text-red-700"
    >
      Sair
    </button>
  );
}

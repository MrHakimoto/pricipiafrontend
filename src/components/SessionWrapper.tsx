// components/SessionWrapper.tsx
'use client';

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function SessionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Verificar se as rotas de API estão acessíveis
    async function checkApiRoutes() {
      try {
        const res = await fetch('/api/auth/csrf');
        if (!res.ok) {
          console.error('NextAuth API routes not properly configured');
        }
      } catch (error) {
        console.error('Failed to reach NextAuth API:', error);
      }
    }
    
    checkApiRoutes();
  }, []);

  return <SessionProvider refetchInterval={5 * 60}>{children}</SessionProvider>;
}
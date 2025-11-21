"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { verifyMagicLink } from "@/lib/auth/auth"; // Sua função axios
import { signIn } from "next-auth/react"; // 🔥 Importante para o NextAuth
import { Loader2, CheckCircle, XCircle } from "lucide-react"; // Ícones opcionais

export default function VerifyMagicLinkPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("Verificando assinatura...");

  // 🔥 CORREÇÃO CRÍTICA: useRef impede que o código rode 2x no React Strict Mode
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const doLogin = async () => {
      try {
        const userId = params.id as string;
        const queryString = `?${searchParams.toString()}`;

        // 1. Chama seu backend Laravel para validar a assinatura
        const response = await verifyMagicLink(userId, queryString);
        
        // O backend retornou o token Sanctum (plainTextToken)
        const laravelToken = response.data.token; 

        setMessage("Assinatura válida! Criando sessão...");

        // 2. Inicia a sessão no NextAuth manualmente
        // Passamos o token para o CredentialsProvider
        const result = await signIn("credentials", {
          laravelToken: laravelToken, // Campo personalizado
          redirect: false,
        });

        if (result?.error) {
          throw new Error("Falha ao estabelecer sessão no Next.js");
        }

        setStatus('success');
        setMessage("Login realizado! Redirecionando...");
        
        // Redireciona para a home/dashboard
        setTimeout(() => router.push("/home"), 1500);

      } catch (error) {
        console.error(error);
        setStatus('error');
        setMessage("Este link é inválido ou já expirou.");
      }
    };

    if (params.id && searchParams.toString()) {
      doLogin();
    } else {
      setStatus('error');
      setMessage("Link malformado.");
    }
  }, [params, searchParams, router]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-[#00091A]">
      <div className="text-center p-8 bg-white dark:bg-[#111827] rounded-2xl shadow-xl max-w-sm w-full">
        <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="animate-spin w-10 h-10 text-blue-600" />}
            {status === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
            {status === 'error' && <XCircle className="w-12 h-12 text-red-500" />}
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{message}</h2>
      </div>
    </div>
  );
}
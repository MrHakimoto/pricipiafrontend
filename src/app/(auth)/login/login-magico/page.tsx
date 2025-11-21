"use client";

import { useState } from "react";
import { requestMagicLink } from "@/lib/auth/auth";

import TopProgressBar from "@/components/Motions/TopProgressBar";
import ProProgressiveBar from "@/components/Motions/ProProgressiveBar";

export default function RequestMagicLinkPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus({ type: "error", message: "Preencha o e-mail!" });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", message: "Enviando link mágico..." });

    try {
      await requestMagicLink(email);
      setStatus({
        type: "success",
        message: "Verifique seu e-mail! O link mágico foi enviado.",
      });
    } catch (error: any) {
      let msg = "Erro ao enviar o link. Verifique o e-mail.";

      if (error?.response?.data?.message) {
        msg = error.response.data.message;
      }

      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center text-white relative overflow-hidden">
        {/* background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('/path-to-pattern.svg')] bg-cover bg-center" />

        <TopProgressBar loading={loading} />
        <ProProgressiveBar isActive={loading} />

        <div className="w-full max-w-md z-10 space-y-6 bg-[#0d1117]/60 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-xl">

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center overflow-hidden">
              <img
                src="https://cdn.principiamatematica.com/119340e2-d838-4b5a-babd-93155672a097.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-center text-2xl font-semibold">Entrar sem Senha</h1>
          <p className="text-center text-gray-300">
            Digite seu e-mail para enviarmos um link mágico de autenticação.
          </p>

          {/* Mensagens */}
          {status.message && status.type === "error" && (
            <div className="p-3 text-center rounded-lg font-medium bg-red-900/40 text-red-300 border border-red-700">
              {status.message}
            </div>
          )}

          {status.message && status.type === "success" && (
            <div className="p-3 text-center rounded-lg font-medium bg-green-900/40 text-green-300 border border-green-700">
              {status.message}
            </div>
          )}

          {status.message && status.type === "info" && (
            <div className="p-3 text-center rounded-lg font-medium bg-blue-900/40 text-blue-300 border border-blue-700">
              {status.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block ml-2 my-2 font-bold text-base">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252]
                focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0E00D0] px-8 py-4 hover:bg-blue-500 rounded-lg 
              text-center text-white font-medium cursor-pointer disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar Link Mágico"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

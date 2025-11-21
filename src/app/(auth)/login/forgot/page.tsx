"use client";

import { useState, FormEvent } from "react";
import { api } from "@/lib/api";
import { forgotPassword } from "@/lib/auth/auth"

import TopProgressBar from "@/components/Motions/TopProgressBar";
import ProProgressiveBar from "@/components/Motions/ProProgressiveBar";

export default function Page() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailField, setEmailField] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailField) {
      setError("Preencha o email!");
      return;
    }

    setError("");
    setInfo("");
    setLoading(true);

    try {
      const result = await forgotPassword(emailField);

      if (result.error) {
        setError(result.error);
      } else {
        setInfo("Enviamos um email para recuperação.");
      }
    } catch (err: unknown) {
      let msg = "Ocorreu um erro inesperado.";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as any).response?.data?.message
      ) {
        msg = (err as any).response.data.message;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center text-white relative overflow-hidden">
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

          <h1 className="text-center text-2xl font-semibold">
            Recuperar Senha
          </h1>

          <p className="text-center text-gray-300">
            Digite seu e-mail para enviarmos o link de recuperação.
          </p>

          {/* Mensagens */}
          {error && (
            <div className="p-3 text-center rounded-lg font-medium bg-red-900/40 text-red-300 border border-red-700">
              {error}
            </div>
          )}

          {info && (
            <div className="p-3 text-center rounded-lg font-medium bg-green-900/40 text-green-300 border border-green-700">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block ml-2 my-2 font-bold text-base">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="Digite seu e-mail"
                className="w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252] 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={emailField}
                onChange={(e) => setEmailField(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0E00D0] px-8 py-4 hover:bg-blue-500 rounded-lg text-center text-white font-medium cursor-pointer disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/axios";
import type { AxiosError } from "axios";

import TopProgressBar from "@/components/Motions/TopProgressBar";
import ProProgressiveBar from "@/components/Motions/ProProgressiveBar";

export default function DefinirSenhaPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [password, setPassword] = useState<string>("");
    const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");

    const [status, setStatus] = useState<{ type: string; message: string }>({
        type: "",
        message: "",
    });

    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", message: "" });

        try {
            await api.post("/reset-password", {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            setStatus({
                type: "success",
                message: "Senha definida com sucesso! Redirecionando...",
            });

            setTimeout(() => router.push("/login"), 2000);
        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;

            let errorMessage = "Erro ao definir senha. O link pode ter expirado.";

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            setStatus({
                type: "error",
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="p-10 text-center text-red-500 text-xl">
                Link inválido ou incompleto.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center text-white relative overflow-hidden">

            <TopProgressBar loading={loading} />
            <ProProgressiveBar isActive={loading} />

            <div className="w-full max-w-md z-10 space-y-6 bg-[#0d1117]/60 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-xl">
                {/* LOGO */}
                <div className="flex justify-center mb-4">
                    <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center">
                        <img
                            src="https://cdn.principiamatematica.com/119340e2-d838-4b5a-babd-93155672a097.png"
                            alt="Logo"
                            className="w-[78px] h-[78px]"
                        />
                    </div>
                </div>

                <h1 className="text-center text-2xl font-semibold">
                    Definir Nova Senha
                </h1>

                {/* MENSAGENS */}
                {status.message && (
                    <div
                        className={`p-3 text-center rounded-lg font-medium ${
                            status.type === "success"
                                ? "bg-green-900/40 text-green-300 border border-green-700"
                                : "bg-red-900/40 text-red-300 border border-red-700"
                        }`}
                    >
                        {status.message}
                    </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block ml-2 my-2 font-bold text-base">
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            placeholder="Digite a nova senha"
                            className="w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252] 
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block ml-2 my-2 font-bold text-base">
                            Confirmar Senha
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            placeholder="Repita a nova senha"
                            className="w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252] 
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0E00D0] px-8 py-4 hover:bg-blue-500 rounded-lg text-center text-white font-medium cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Salvando..." : "Definir Senha"}
                    </button>
                </form>
            </div>
        </div>
    );
}

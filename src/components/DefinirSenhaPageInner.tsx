"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/axios";
import type { AxiosError } from "axios";

import TopProgressBar from "@/components/Motions/TopProgressBar";
import ProProgressiveBar from "@/components/Motions/ProProgressiveBar";

export default function DefinirSenhaPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [status, setStatus] = useState({ type: "", message: "" });
    const [loading, setLoading] = useState(false);

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
                {/* resto do conteúdo */}
            </div>
        </div>
    );
}

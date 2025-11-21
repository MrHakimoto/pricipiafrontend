"use client"

import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import ProProgressiveBar from "@/components/Motions/ProProgressiveBar"

import TopProgressBar from "@/components/Motions/TopProgressBar";

const Page = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmailField] = useState('');
    const [password, setPasswordField] = useState('');
    const router = useRouter();



    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Preencha email e senha!');
            return;
        }

        setError("");
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/home",
            });

            if (res?.error) {
                setError("Email ou senha inválidos");
            } else if (res?.url) {
                router.push(res.url);
            }
        } catch (err) {
            setError("Ocorreu um erro durante o login");
            setPasswordField("");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center text-white relative overflow-hidden">
                {/* Não tem funcionalidade ainda, só o react puro */}
                <div className="absolute inset-0 opacity-10 bg-[url('/path-to-pattern.svg')] bg-cover bg-center" />
                <TopProgressBar loading={loading} />

                <ProProgressiveBar isActive={loading} />
                <div className="w-full max-w-md z-10 space-y-6">
                   <div className="flex justify-center mb-4">
  <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center overflow-hidden">
    <img
      src="https://cdn.principiamatematica.com/119340e2-d838-4b5a-babd-93155672a097.png"
      alt="Logo"
      className="w-full h-full object-contain"
    />
  </div>
</div>

                    <h1 className="text-center text-2xl font-semibold">Seja Bem-vindo ao Princípia Matemática</h1>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block ml-2 my-4 font-bold text-base text-white">E-mail</label>
                            <input
                                id="email"
                                autoFocus
                                type="email"
                                placeholder="Digite o seu e-mail"
                                className="w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={e => setEmailField(e.target.value)}
                                value={email}
                                disabled={loading}

                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block ml-2 my-4 font-bold text-white">Senha</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Digite a sua senha"
                                className="w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={e => setPasswordField(e.target.value)}
                                value={password}
                                disabled={loading}
                            />
                        </div>
                        {error && <p className='text-red-600 ml-5 mt-2'>{error}</p>}

                        <div className="text-left text-sm">
                            <Link href={"/login/forgot"}>
                            <button type="button" className="text-white hover:underline cursor-pointer">
                                Esqueceu sua senha?
                            </button>
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#0E00D0] px-8 py-4 hover:bg-blue-500 rounded-lg text-center text-white font-medium cursor-pointer"
                        >
                            Entrar
                        </button>
                    </form>

                    <div className="relative my-4 flex items-center">
                        <div className="flex-grow h-px bg-gray-700" />
                        <span className="px-3 text-white font-bold text-lg">Ou entre com</span>
                        <div className="flex-grow h-px bg-gray-700" />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => signIn("google", { callbackUrl: "/home" })}
                            type="button"
                            disabled={loading}
                            className="flex-1 bg-[#1B1F27] text-lg text-white text-bold rounded-lg px-8 py-4 flex items-center justify-center gap-2 text-sm hover:bg-gray-700 cursor-pointer"
                        >
                            <span className="text-xl text-white text-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><path fill="#ffc107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917" /><path fill="#ff3d00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691" /><path fill="#4caf50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.9 11.9 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44" /><path fill="#1976d2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917" /></svg>
                            </span>Google
                        </button>
                    <Link href={"/login/login-magico"}>
                        <button disabled={false} className="flex-1 cursor-pointer text-lg text-white text-bold bg-[#1B1F27]  rounded-lg px-8 py-4 flex  flex items-center justify-center gap-2 text-sm hover:bg-gray-700">
                            <span className="text-lg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M13.293 3.96a4.771 4.771 0 1 1 6.747 6.747l-3.03 3.03l-1.415-1.413l3.03-3.031a2.771 2.771 0 1 0-3.918-3.92l-3.031 3.031l-1.414-1.414zm2.12 6.04l-5.415 5.414L8.584 14l5.414-5.414zm-7.01 1.676l-3.03 3.031a2.771 2.771 0 1 0 3.92 3.92l3.03-3.031l1.414 1.414l-3.03 3.03a4.771 4.771 0 1 1-6.748-6.747l3.03-3.03z" /></svg>

                            </span> Link por e-mail
                        </button>
                        </Link>
                    </div>
                    {/* <div className="relative my-4 flex items-center">
                        <div className="flex-grow h-px bg-gray-700" />
                        <span className="px-3 text-gray-400 text-sm">Ainda não tem conta?</span>
                        <div className="flex-grow h-px bg-gray-700" />
                    </div>
                    <div className="text-center text-gray-500 text-sm">

                        <Link href="/cadastro"> <button className="w-full bg-[#1B1F27] text-xl text-white text-bold rounded-lg px-8 py-4  items-center justify-center text-sm hover:bg-gray-700 cursor-pointer">Faça seu cadastro</button></Link>
                    </div> */}
                </div>
            </div>
        </>
    );
}

export default Page;
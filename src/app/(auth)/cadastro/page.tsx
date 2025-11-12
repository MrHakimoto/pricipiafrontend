'use client';

import { useState } from 'react';
import { registerUser } from './actions';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from "react-hook-form";
import { TtBar } from '@/components/Motions/ttBar';


export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [error, setErrorr] = useState('');
    const [success, setSuccess] = useState('');
    const [loading1, setLoading1] = useState(false);
    const { loading, progress, start, finish } = TtBar();

    const {
        setError,
        clearErrors,
        formState: { errors },
    } = useForm();

    const validateEmail = (value: string) => {
        if (!value.trim()) {
            return "O e-mail é obrigatório";
        }

        // Expressão: algo@algo.com
        const emailRegex = /^[^@]+@[^@]+\.[^@]*com[^@]*$/i;
        if (!emailRegex.test(value)) {
            return "O e-mail está inválido";
        }

        return null;
    };

    const validateNome = (value: string) => {
        const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;

        if (!regex.test(value)) {
            return "O nome deve conter apenas letras e espaços.";
        }

        if (form.name.length < 3) {

            return "O seu nome deve ter pelo menos 3 caracteres";
        }

        return null

    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let hasError = false;

        const emailError = validateEmail(form.email);
        if (emailError) {
            setError("email", { type: 'manual', message: emailError });
            hasError = true;
        } else {
            clearErrors("email");
        }
        //Validação de NOME


        const nameError = validateNome(form.name);
        if (nameError) {
            setError("name", { type: 'manual', message: nameError });
            hasError = true;
        } else {
            clearErrors("name");
        }


        // Validação de senha
        if (form.password.length < 6) {
            setError("password", {
                type: 'manual',
                message: "A senha deve ter pelo menos 6 caracteres",
            });
            hasError = true;
        } else {
            clearErrors("password");
        }

        console.log(hasError, errors)

        if (!hasError) {
            // console.log("Formulário filezinho:");



            setLoading1(true)
            console.log(loading)
            start();
            const response = await registerUser(form);
            if (response.success) {
                setLoading1(false)
                setSuccess('Registrado com sucesso!');
                finish()
                console.log(loading)
                // ttBar

            } else {
                setLoading1(false)
                setErrorr(response.error);
                finish()
                console.log(loading)

            }
        }
    };

    const classeR = "text-red-600";
    const classeRR = "outline outline-2 outline-red-500";

    return (

        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center text-white relative overflow-hidden">
            {/* Não tem funcionalidade ainda, só o react puro */}
            <div className="absolute inset-0 opacity-10 bg-[url('/path-to-pattern.svg')] bg-cover bg-center" />
            {/* LOADING PROGRESSIVE BAR NÃO MEXER PORRA */}
            {loading && (
                <div
                    className="fixed top-0 left-0 h-1 bg-blue-500 z-50 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            )}

            <div className="w-full max-w-md z-10 space-y-6">
                <div className="flex justify-center mb-6">
                    <div className="bg-white rounded-full">
                        {/* Img da logo */}
                       <img src="/image.png" alt="Logo" className="w-[78px] h-[78px]" />

                    </div>
                </div>

                <h1 className="text-center text-2xl font-semibold">Seja Bem-vindo ao Princípia Matemática</h1>


                {/* ALLERTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA TEM O DROPDOWNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN */}
                {/* {success && <p className='text-green-600 ml-5 mt-2'>{success}</p>} */}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className={`${errors.name ? classeR : "text-white"} block ml-2 my-4 font-bold text-base `}>Nome e Sobrenome</label>
                        <input
                            id="name"
                            type="text"
                            className={`${errors.name && classeRR} w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Sebastião Pinto"
                            autoFocus
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        {errors.name && <p className='text-red-600 ml-5 mt-2'>{errors.name?.message?.toString()}</p>}

                    </div>
                    <div>
                        <label htmlFor="email" className={`${errors.email ? classeR : "text-white"} block ml-2 my-4 font-bold text-base `}>E-mail</label>
                        <input
                            id="email"
                            type="email"
                            className={`${errors.email && classeRR} w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Digite o seu e-mail"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        {errors.email && <p className='text-red-600 ml-5 mt-2'>{errors.email?.message?.toString()}</p>}
                        {error && <p className='text-red-600 ml-5 mt-2'>{error}</p>}

                    </div>

                    <div>
                        <label htmlFor="password" className={`${errors.password ? classeR : "text-white"} block ml-2 my-4 font-bold text-base `}> Senha</label>
                        <input
                            id="password"
                            type="password"
                            className={`${errors.password && classeRR} w-full px-8 py-4 rounded-lg bg-[#1B1F27] placeholder-[#3A4252] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Digite a sua senha"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}

                        />
                        {errors.password && <p className='text-red-600 ml-5 mt-2'>{errors.password?.message?.toString()}</p>}


                    </div>

                    <div className="text-right text-sm">
                        <button type="button" className="text-white hover:underline">
                            Esqueceu sua senha?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#0E00D0] px-8 py-4 hover:bg-blue-500 rounded-lg text-center text-white font-bold text-lg cursor-pointer"
                    >
                        Cadastrar
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
                    <button disabled={true} className="flex-1 cursor-pointer text-lg text-white text-bold bg-[#1B1F27]  rounded-lg px-8 py-4 flex  flex items-center justify-center gap-2 text-sm hover:bg-gray-700">
                        <span className="text-lg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M13.293 3.96a4.771 4.771 0 1 1 6.747 6.747l-3.03 3.03l-1.415-1.413l3.03-3.031a2.771 2.771 0 1 0-3.918-3.92l-3.031 3.031l-1.414-1.414zm2.12 6.04l-5.415 5.414L8.584 14l5.414-5.414zm-7.01 1.676l-3.03 3.031a2.771 2.771 0 1 0 3.92 3.92l3.03-3.031l1.414 1.414l-3.03 3.03a4.771 4.771 0 1 1-6.748-6.747l3.03-3.03z" /></svg>

                        </span> Link por e-mail
                    </button>
                </div>

                <div className="text-center text-gray-500 text-sm">
                    Já tem uma conta?
                    <Link href='/login' className='cursor-pointer'><button className="ml-1 text-white underline cursor-pointer hover:text-blue-400"> Logue-se</button></Link>
                </div>

            </div>
        </div>
    );
}
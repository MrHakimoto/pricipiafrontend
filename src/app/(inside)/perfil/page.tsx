"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMyProfile, saveMyProfile } from "@/lib/perfil/userData";
import { useSession } from "next-auth/react";

import type { UserProfile } from "@/lib/perfil/userData";

type ProfileForm = UserProfile & {
  celular: string;
};

// type ProfileForm = {
//   id: string;
//   name: string;
//   cpf: string;
//   birth_date: string;
//   gender: string;
//   celular: string;
// };

type ErrorMap = Record<string, string>;

export default function Profile() {
  const [form, setForm] = useState<ProfileForm>({
    id: "",
    name: "",
    cpf: "",
    birth_date: "",
    gender: "",
    celular: "",
  });

  const [errors, setErrors] = useState<ErrorMap>({});
  const [abaAtiva, setAbaAtiva] = useState<"dadosPessoais" | "dadosAcesso" | "assinaturas">(
    "dadosPessoais"
  );
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [existProfile, setExistProfile] = useState<boolean>(false);

  const { data: session, status, update } = useSession();
  // session do NextAuth normalmente tem tipos, mas para acessar laravelToken sem erro:
  const sessionAny = session as any;

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const data: any = await fetchMyProfile(sessionAny?.laravelToken);
        console.log("fetchMyProfile ->", data);

        if (data) {
          // Formata a data (AAAA-MM-DD -> DD/MM/AAAA)
          const formatarData = (dataISO?: string | null): string => {
            if (!dataISO) return "";

            const date = new Date(dataISO);
            const dia = String(date.getDate()).padStart(2, "0");
            const mes = String(date.getMonth() + 1).padStart(2, "0");
            const ano = date.getFullYear();
            return `${dia}/${mes}/${ano}`;
          };

          // Mapeia o gênero retornado
          const mapearGender = (gender?: string | null): string => {
            switch (gender?.toUpperCase()) {
              case "M":
                return "masculino";
              case "F":
                return "feminino";
              default:
                return "nao-informar";
            }
          };

          // Aplica as máscaras usando as funções já definidas
          setForm({
            id: String(data.user_id ?? ""),
            name: sessionAny?.user?.name ?? "",
            cpf: aplicarMascaraCPF(String(data.cpf ?? "")),
            birth_date: formatarData(data.birth_date),
            gender: mapearGender(data.gender),
            celular: aplicarMascaraTelefone(String(data.phone ?? "")),
          });
        }
      } catch (error) {
        setExistProfile(false);
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setExistProfile(true);
        setIsLoading(false);
      }
    };

    if (status !== "loading" && sessionAny?.laravelToken) {
      loadData();
    }
  }, [status, sessionAny?.laravelToken]);

  // Máscara para CPF
  const aplicarMascaraCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;

    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(
      9,
      11
    )}`;
  };

  // Validar CPF
  const validarCPF = (cpfRaw: string): boolean => {
    const cpf = cpfRaw.replace(/\D/g, "");

    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    let remainder: number;

    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  };

  // Máscara para telefone
  const aplicarMascaraTelefone = (value: string): string => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Máscara para data
  const aplicarMascaraData = (value: string): string => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;

    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target as HTMLInputElement;
    let valorFormatado = value;

    // Aplicar máscaras conforme o campo
    switch (name) {
      case "cpf":
        valorFormatado = aplicarMascaraCPF(value);
        break;
      case "celular":
        valorFormatado = aplicarMascaraTelefone(value);
        break;
      case "birth_date":
        valorFormatado = aplicarMascaraData(value);
        break;
      default:
        break;
    }

    setForm((prev) => ({ ...prev, [name]: valorFormatado }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validarFormulario = (): boolean => {
    const novosErros: ErrorMap = {};

    // Validar nome
    if (!form.name || form.name.trim().length <= 3) {
      novosErros.name = "Nome deve ter mais de 3 caracteres";
    }

    // Validar CPF
    if (form.cpf) {
      const cpfNumeros = form.cpf.replace(/\D/g, "");
      if (cpfNumeros.length !== 11 || !validarCPF(cpfNumeros)) {
        novosErros.cpf = "CPF inválido";
      }
    }

    // Validar telefone
    if (form.celular) {
      const telefoneNumeros = form.celular.replace(/\D/g, "");
      if (telefoneNumeros.length !== 11) {
        novosErros.celular = "Telefone inválido";
      }
    }

    // Validar data
    if (form.birth_date) {
      const dataNumeros = form.birth_date.replace(/\D/g, "");
      if (dataNumeros.length !== 8) {
        novosErros.birth_date = "Data inválida";
      }
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const converterDataParaISO = (data?: string): string => {
    if (!data) return "";
    const partes = data.split("/");
    if (partes.length !== 3) return "";
    const [dia, mes, ano] = partes;
    return `${ano}-${mes}-${dia}`; // formato ISO
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validarFormulario()) {
      setIsSubmitting(false);
      return;
    }

    // Preparar dados para envio (remover máscaras e ajustar formatos)
    const dadosParaEnvio = {
      id: form.id,
      name: (form.name ?? "").trim(),
      cpf: (form.cpf ?? "").replace(/\D/g, ""),
      phone: form.celular.replace(/\D/g, ""),
      gender: form.gender ? form.gender[0].toUpperCase() : undefined,
      birth_date: converterDataParaISO(form.birth_date),
    };

    console.log("Dados para envio ao backend:", dadosParaEnvio);

    try {
      await saveMyProfile(dadosParaEnvio, sessionAny?.laravelToken!);

      // Atualiza sessão (pode ser necessário adaptar dependendo do tipo real do update)
      if (typeof update === "function") {
        await update({
          ...(session as any),
          user: {
            ...(sessionAny?.user ?? {}),
            name: dadosParaEnvio.name,
          },
        });
      }

      alert("Dados salvos");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar os dados. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  console.log(sessionAny?.user?.name);

  return (
    <div className="min-h-screen bg-[#00091A] text-white font-sans relative">
      {/* Main */}
      <main className="flex gap-8 mx-auto p-8 max-w-5xl items-start">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1b1f27] p-12 rounded-lg w-64 text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
            {/* SVG */}
            <svg width="94" height="93" viewBox="0 0 94 93" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* ...path omitted for brevity (keeps original) */}
              <path d="M94 46.5C94 20.8785 72.897 0 47 0C21.103 0 0 20.8785 0 46.5C0 59.985 5.875 72.1215 15.181 80.631C15.181 80.6775 15.181 80.6775 15.134 80.724C15.604 81.189 16.168 81.561 16.638 81.9795C16.92 82.212 17.155 82.4445 17.437 82.6305C18.283 83.328 19.223 83.979 20.116 84.63C20.445 84.8625 20.727 85.0485 21.056 85.281C21.949 85.8855 22.889 86.4435 23.876 86.955C24.205 87.141 24.581 87.3735 24.91 87.5595C25.85 88.071 26.837 88.536 27.871 88.9545C28.247 89.1405 28.623 89.3265 28.999 89.466C30.033 89.8845 31.067 90.2565 32.101 90.582C32.477 90.7215 32.853 90.861 33.229 90.954C34.357 91.2795 35.485 91.5585 36.613 91.8375C36.942 91.9305 37.271 92.0235 37.647 92.07C38.963 92.349 40.279 92.535 41.642 92.6745C41.83 92.6745 42.018 92.721 42.206 92.7675C43.804 92.907 45.402 93 47 93C48.598 93 50.196 92.907 51.747 92.7675C51.935 92.7675 52.123 92.721 52.311 92.6745C53.674 92.535 54.99 92.349 56.306 92.07C56.635 92.0235 56.964 91.884 57.34 91.8375C58.468 91.5585 59.643 91.326 60.724 90.954C61.1 90.8145 61.476 90.675 61.852 90.582C62.886 90.21 63.967 89.8845 64.954 89.466C65.33 89.3265 65.706 89.1405 66.082 88.9545C67.069 88.536 68.056 88.071 69.043 87.5595C69.419 87.3735 69.748 87.141 70.077 86.955C71.017 86.397 71.957 85.8855 72.897 85.281C73.226 85.095 73.508 84.8625 73.837 84.63C74.777 83.979 75.67 83.328 76.516 82.6305C76.798 82.398 77.033 82.1655 77.315 81.9795C77.832 81.561 78.349 81.1425 78.819 80.724C78.819 80.6775 78.819 80.6775 78.772 80.631C88.125 72.1215 94 59.985 94 46.5ZM70.218 69.6105C57.481 61.1475 36.613 61.1475 23.782 69.6105C21.714 70.959 20.022 72.54 18.612 74.2605C11.468 67.0995 7.05 57.288 7.05 46.5C7.05 24.6915 24.957 6.975 47 6.975C69.043 6.975 86.95 24.6915 86.95 46.5C86.95 57.288 82.532 67.0995 75.388 74.2605C74.025 72.54 72.286 70.959 70.218 69.6105Z" fill="white" />
            </svg>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-semibold">
            {sessionAny?.user?.name ?? "Usuário"}
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-gray-400 mb-4">
            {sessionAny?.user?.email ?? "—"}
          </motion.p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cursor-pointer bg-[#0e00d0] text-white px-4 py-2 rounded mb-4 hover:bg-blue-700 font-medium w-full">
            Ver minhas estatísticas
          </motion.button>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-sm text-white">
            <span className="font-medium">Nível 19 | Ranking 1</span>
            <br />
            desde 01/01/2025
          </motion.p>
        </motion.aside>

        {/* Conteúdo Principal */}
        <section className="flex-1">
          {/* Tabs */}
          <motion.div className="flex gap-6 border-b border-gray-700 text-sm ml-2" initial="hidden" animate="visible" variants={containerVariants}>
            {["dadosPessoais", "dadosAcesso", "assinaturas"].map((tab) => (
              <motion.button key={tab} variants={tabVariants} className={`cursor-pointer pb-2 ${abaAtiva === tab ? "border-b-2 border-white text-white font-medium" : "text-gray-400 hover:text-white"}`} onClick={() => setAbaAtiva(tab as any)}>
                {tab === "dadosPessoais" && "Dados pessoais"}
                {tab === "dadosAcesso" && "Dados de acesso"}
                {tab === "assinaturas" && "Assinaturas"}
              </motion.button>
            ))}
          </motion.div>

          {/* Conteúdo da Aba */}
          <motion.section key={abaAtiva} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="border border-gray-700 rounded-lg p-6 mt-[-1px]">
            <AnimatePresence mode="wait">
              {abaAtiva === "dadosPessoais" && (
                <motion.form initial="hidden" animate="visible" variants={containerVariants} onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                  <motion.div variants={itemVariants} className="col-span-2">
                    <label className="block mb-1 text-sm text-gray-300">Nome *</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Digite seu nome completo" className="w-full border border-gray-600 bg-transparent p-2 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0e00d0]" />
                    {errors.name && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        {errors.name}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block mb-1 text-sm text-gray-300">CPF</label>
                    <input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" maxLength={14} className="w-full border border-gray-600 bg-transparent p-2 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0e00d0]" />
                    {errors.cpf && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        {errors.cpf}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block mb-1 text-sm text-gray-300">Nascimento</label>
                    <input name="birth_date" value={form.birth_date} onChange={handleChange} placeholder="DD/MM/AAAA" maxLength={10} className="w-full border border-gray-600 bg-transparent p-2 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0e00d0]" />
                    {errors.birth_date && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        {errors.birth_date}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block mb-1 text-sm text-gray-300">Gênero</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="w-full border border-gray-600 bg-transparent p-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#0e00d0] [&>option]:bg-[#0a0a0a] [&>option]:text-white">
                      <option value="">Selecione</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="nao-informar">Prefiro não dizer</option>
                    </select>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block mb-1 text-sm text-gray-300">Celular</label>
                    <input name="celular" value={form.celular} onChange={handleChange} placeholder="(00) 00000-0000" maxLength={15} className="w-full border border-gray-600 bg-transparent p-2 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0e00d0]" />
                    {errors.celular && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        {errors.celular}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="col-span-2 flex justify-end">
                    <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: isSubmitting ? 1 : 1.05 }} whileTap={{ scale: isSubmitting ? 1 : 0.95 }} className="bg-[#0e00d0] cursor-pointer px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          ⏳
                        </motion.div>
                      ) : (
                        <>
                          Salvar
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 7v12q0 .825-.587 1.413T19 21H5q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h12zm-9 11q1.25 0 2.125-.875T15 15t-.875-2.125T12 12t-2.125.875T9 15t.875 2.125T12 18m-6-8h9V6H6z" />
                          </svg>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.form>
              )}

              {abaAtiva === "dadosAcesso" && (
                <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4 text-sm">
                  <motion.div variants={itemVariants}>
                    <p className="text-gray-300 mb-1">Email:</p>
                    <p className="text-white">{sessionAny?.user?.email ?? "—"}</p>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <p className="text-gray-300 mb-1">Senha:</p>
                    <motion.button onClick={() => setMostrarAlterarSenha(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cursor-pointer text-white bg-[#0e00d0] px-3 py-1 rounded text-sm hover:bg-blue-700">
                      Alterar senha
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {abaAtiva === "assinaturas" && (
                <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col items-center justify-center text-center space-y-4">
                  <motion.p variants={itemVariants} className="text-white font-medium">
                    Nenhuma assinatura cadastrada.
                  </motion.p>
                  <motion.button variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cursor-pointer bg-[#0e00d0] text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                    Ir para cursos
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </section>
      </main>

      {/* Modal Alterar Senha */}
      <AnimatePresence>
        {mostrarAlterarSenha && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#00091A] border border-gray-700 rounded-lg p-6 w-full max-w-md relative">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setMostrarAlterarSenha(false)} className="cursor-pointer absolute top-2 right-2 text-white text-xl hover:text-[#D0004C]">
                &times;
              </motion.button>

              <h2 className="text-white font-semibold text-lg mb-1">Alterar senha</h2>
              <p className="text-gray-400 text-sm mb-4">Digite uma nova senha para alterar a atual.</p>

              <div className="mb-4">
                <label className="block text-sm text-white font-semibold mb-1">Nova senha</label>
                <input type="password" className="w-full p-2 bg-transparent border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#0e00d0]" />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-white font-semibold mb-1">Confirmar nova senha</label>
                <input type="password" className="w-full p-2 bg-transparent border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#0e00d0]" />
              </div>

              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#D0004C] cursor-pointer text-white px-4 py-2 rounded hover:bg-[#0e00d0] w-full">
                Alterar senha
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMyProfile, saveMyProfile, setPassword, unlinkGoogleAccount, checkGoogleStatus, removerAvatar, salvarAvatar } from "@/lib/perfil/userData";
import { useSession, signIn } from "next-auth/react"; // <--- Importei signIn

import type { UserProfile } from "@/lib/perfil/userData";
import ProfileSkeleton from "@/components/Skeletons/ProfileCardSkeleton";
import ProfileEditorModal from "@/components/editor/ProfileEditorModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { getUser } from '@/lib/dailyCheck/daily'; // Importe a função getUser


const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);



type ProfileForm = UserProfile & {
  celular: string;
};

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
  const [newPassword, SetNewPassword] = useState<string>("");
  const [confirmPassword, SetConfirmPassword] = useState<string>("");
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const { data: session, status, update } = useSession();
  const [isGoogle, setIsGoogle] = useState<boolean | undefined>();
  const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: ""
  });

  // const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState<boolean>(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState<boolean>(false);
  const [avatarAction, setAvatarAction] = useState<'idle' | 'uploading' | 'removing'>('idle');
  const currentAvatar = session?.user?.image || null;




  const {
    isUploading,
    editingImageFile,
    fileInputRef,
    handleFileSelect,
    openFileSelector,
    confirmImageUpload,
    setEditingImageFile
  } = useImageUpload();

  const sessionAny = session as any;


  // useEffect(() => {
  //   if (status === "authenticated" && sessionAny?.laravelToken) {
  //     if (session?.user?.image) {
  //       setAvatarUrl(session?.user?.image)
  //     }
  //   }


  // }, [status, session, sessionAny?.laravelToken, update])

  // useEffect(() => {
  //   const syncImageWithBackend = async () => {
  //     // Só roda se estiver autenticado e tiver o token
  //     if (status === "authenticated" && sessionAny?.laravelToken) {
  //       try {
  //         // 1. Busca o perfil no backend
  //         const profile = await getUser(sessionAny.laravelToken);

  //         // O avatar que veio do banco (pode ser uma URL string ou null)
  //         const backendAvatar = profile?.avatar || null;

  //         // A imagem que está na sessão agora
  //         const sessionAvatar = session?.user?.image || null;

  //         // Atualiza o estado local do avatar
  //         setAvatarUrl(backendAvatar);

  //         // 2. COMPARAÇÃO INTELIGENTE:
  //         // Só chamamos o update se os valores forem DIFERENTES.
  //         if (backendAvatar !== sessionAvatar) {
  //           console.log("Layout: Sincronizando imagem da sessão...");

  //           await update({
  //             ...session,
  //             user: {
  //               ...session?.user,
  //               image: backendAvatar,
  //             },
  //           });
  //         }
  //       } catch (error) {
  //         console.error("Layout: Erro ao sincronizar imagem:", error);
  //       }
  //     }
  //   };

  //   syncImageWithBackend();
  // }, [status, session, sessionAny?.laravelToken, update]);



  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const responseGoogle = await checkGoogleStatus(sessionAny?.laravelToken);
        const data: any = await fetchMyProfile(sessionAny?.laravelToken);
        console.log("fetchMyProfile ->", data);

        if (data) {
          setIsGoogle(responseGoogle)
          const formatarData = (dataISO?: string | null): string => {
            if (!dataISO) return "";

            const date = new Date(dataISO);
            const dia = String(date.getDate()).padStart(2, "0");
            const mes = String(date.getMonth() + 1).padStart(2, "0");
            const ano = date.getFullYear();
            return `${dia}/${mes}/${ano}`;
          };

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

  const validatePassword = (password: string): string | null => {
    if (!password || password.trim().length < 6) {
      return "A senha deve ter pelo menos 6 caracteres";
    }
    return null;
  };



  const handleSaveAvatar = async (file: File) => {
    if (!sessionAny?.laravelToken || !form.id) return;

    setAvatarAction('uploading');
    try {
      const imageUrl = await confirmImageUpload(file);
      const response = await salvarAvatar(sessionAny.laravelToken, form.id, imageUrl);

      if (response) {
        // ✅ Atualiza apenas a session - remove estado local
        await update({
          user: {
            ...session?.user,
            image: imageUrl,
          },
        });

        setPopup({
          open: true,
          title: "Sucesso!",
          message: "Avatar atualizado com sucesso."
        });
      }
    } catch (error) {
      console.error("Erro ao salvar avatar:", error);
      setPopup({
        open: true,
        title: "Erro",
        message: "Não foi possível atualizar o avatar."
      });
    } finally {
      setAvatarAction('idle');
    }
  };


  const handleRemoveAvatar = async () => {
    if (!sessionAny?.laravelToken || !form.id) return;

    setAvatarAction('removing');
    try {
      const response = await removerAvatar(sessionAny.laravelToken, form.id);

      if (response !== null) {
        // ✅ CORREÇÃO: Atualiza a session corretamente
        await update({
          user: {
            ...session?.user,
            image: undefined, // Remove a imagem
          },
        });

        setPopup({
          open: true,
          title: "Sucesso!",
          message: "Avatar removido com sucesso."
        });

      } else {
        throw new Error("Falha ao remover avatar no servidor");
      }
    } catch (error: any) {
      console.error("Erro ao remover avatar:", error);
      setPopup({
        open: true,
        title: "Erro",
        message: error.message || "Não foi possível remover o avatar."
      });
    } finally {
      setAvatarAction('idle');
    }
  };

  // Função para selecionar imagem
  const handleImageSelect = (file: File) => {
    setEditingImageFile(file);
  };

  const handleSetPassword = async () => {
    const newPassError = validatePassword(newPassword);
    if (newPassError) {
      setErrors((prev) => ({ ...prev, newPassword: newPassError }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "As senhas não conferem" }));
      return;
    }

    setErrors((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
    setIsChangingPassword(true);

    try {
      await setPassword(sessionAny?.laravelToken, newPassword);
      setPopup({
        open: true,
        title: "Senha atualizada!",
        message: "Sua senha foi alterada com sucesso."
      });

      SetNewPassword("");
      SetConfirmPassword("");
      setMostrarAlterarSenha(false);
    } catch (error) {
      console.log("Deu erro", error);
      setPopup({
        open: true,
        title: "Erro",
        message: "Não foi possível alterar sua senha. Tente novamente."
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

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

  const aplicarMascaraTelefone = (value: string): string => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const aplicarMascaraData = (value: string): string => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;

    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target as HTMLInputElement;
    let valorFormatado = value;

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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validarFormulario = (): boolean => {
    const novosErros: ErrorMap = {};

    if (!form.name || form.name.trim().length <= 3) {
      novosErros.name = "Nome deve ter mais de 3 caracteres";
    }

    if (form.cpf) {
      const cpfNumeros = form.cpf.replace(/\D/g, "");
      if (cpfNumeros.length !== 11 || !validarCPF(cpfNumeros)) {
        novosErros.cpf = "CPF inválido";
      }
    }

    if (form.celular) {
      const telefoneNumeros = form.celular.replace(/\D/g, "");
      if (telefoneNumeros.length !== 11) {
        novosErros.celular = "Telefone inválido";
      }
    }

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
    return `${ano}-${mes}-${dia}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validarFormulario()) {
      setIsSubmitting(false);
      return;
    }

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

      if (typeof update === "function") {
        await update({
          ...(session as any),
          user: {
            ...(sessionAny?.user ?? {}),
            name: dadosParaEnvio.name,
          },
        });
      }

      setPopup({
        open: true,
        title: "Perfil atualizado",
        message: "Seus dados foram salvos com sucesso."
      });
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      setPopup({
        open: true,
        title: "Erro",
        message: "Erro ao salvar os dados. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para iniciar o vinculo com o Google
  const handleGoogleLink = () => {
    // O 'callbackUrl' garante que o usuário volte para o perfil após vincular
    signIn("google", { callbackUrl: "/perfil" });
  };

  const handleUnlinkGoogle = async () => {
    const response = await unlinkGoogleAccount(sessionAny?.laravelToken!);
    if (response) {
      setIsGoogle(false);
    }
  }




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

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-[#00091A] dark:text-white font-sans relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e, handleImageSelect)}
        accept="image/*"
        className="hidden"
      />
      {/* Main */}
      <main className="flex flex-col md:flex-row gap-8 mx-auto p-6 md:p-8 max-w-5xl items-start">

        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1b1f27] p-8 md:p-12 rounded-lg w-full md:w-64 text-center"
        >
          {/* Container do Avatar com Hover */}
          <div
            className="relative w-20 h-20 mx-auto mb-4 group"
            onMouseEnter={() => setIsHoveringAvatar(true)}
            onMouseLeave={() => setIsHoveringAvatar(false)}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-full h-full rounded-full overflow-hidden bg-gray-700 flex items-center justify-center relative"
            >
              {/* ✅ Use apenas session?.user?.image para consistência */}
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Avatar do usuário"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <svg width="64" height="64" viewBox="0 0 94 93" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M94 46.5C94 20.8785 72.897 0 47 0C21.103 0 0 20.8785 0 46.5C0 59.985 5.875 72.1215 15.181 80.631C15.181 80.6775 15.181 80.6775 15.134 80.724C15.604 81.189 16.168 81.561 16.638 81.9795C16.92 82.212 17.155 82.4445 17.437 82.6305C18.283 83.328 19.223 83.979 20.116 84.63C20.445 84.8625 20.727 85.0485 21.056 85.281C21.949 85.8855 22.889 86.4435 23.876 86.955C24.205 87.141 24.581 87.3735 24.91 87.5595C25.85 88.071 26.837 88.536 27.871 88.9545C28.247 89.1405 28.623 89.3265 28.999 89.466C30.033 89.8845 31.067 90.2565 32.101 90.582C32.477 90.7215 32.853 90.861 33.229 90.954C34.357 91.2795 35.485 91.5585 36.613 91.8375C36.942 91.9305 37.271 92.0235 37.647 92.07C38.963 92.349 40.279 92.535 41.642 92.6745C41.83 92.6745 42.018 92.721 42.206 92.7675C43.804 92.907 45.402 93 47 93C48.598 93 50.196 92.907 51.747 92.7675C51.935 92.7675 52.123 92.721 52.311 92.6745C53.674 92.535 54.99 92.349 56.306 92.07C56.635 92.0235 56.964 91.884 57.34 91.8375C58.468 91.5585 59.643 91.326 60.724 90.954C61.1 90.8145 61.476 90.675 61.852 90.582C62.886 90.21 63.967 89.8845 64.954 89.466C65.33 89.3265 65.706 89.1405 66.082 88.9545C67.069 88.536 68.056 88.071 69.043 87.5595C69.419 87.3735 69.748 87.141 70.077 86.955C71.017 86.397 71.957 85.8855 72.897 85.281C73.226 85.095 73.508 84.8625 73.837 84.63C74.777 83.979 75.67 83.328 76.516 82.6305C76.798 82.398 77.033 82.1655 77.315 81.9795C77.832 81.561 78.349 81.1425 78.819 80.724C78.819 80.6775 78.819 80.6775 78.772 80.631C88.125 72.1215 94 59.985 94 46.5ZM70.218 69.6105C57.481 61.1475 36.613 61.1475 23.782 69.6105C21.714 70.959 20.022 72.54 18.612 74.2605C11.468 67.0995 7.05 57.288 7.05 46.5C7.05 24.6915 24.957 6.975 47 6.975C69.043 6.975 86.95 24.6915 86.95 46.5C86.95 57.288 82.532 67.0995 75.388 74.2605C74.025 72.54 72.286 70.959 70.218 69.6105Z" fill="white" />
                </svg>
              )}

              {/* Overlay de Hover */}
              <AnimatePresence>
                {isHoveringAvatar && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center"
                  >
                    <div className="flex gap-2">
                      {/* Botão Alterar */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={openFileSelector}
                        disabled={avatarAction !== 'idle'}
                        className="p-2 cursor-pointer bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors"
                        title="Alterar avatar"
                      >
                        <EditIcon />
                      </motion.button>

                      {/* Botão Remover (só aparece se tiver avatar) */}
                      {currentAvatar && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleRemoveAvatar}
                          disabled={avatarAction !== 'idle'}
                          className="p-2 cursor-pointer bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                          title="Remover avatar"
                        >
                          <TrashIcon />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading Overlay - ✅ Usando avatarAction */}
              {avatarAction !== 'idle' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                </div>
              )}
            </motion.div>

            {/* Ícone da Câmera (sempre visível quando não há hover e não há avatar) */}
            {!isHoveringAvatar && !currentAvatar && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openFileSelector}
                disabled={avatarAction !== 'idle'}
                className="absolute -bottom-1 -right-1 p-2 bg-[#0e00d0] rounded-full text-white hover:bg-blue-700 transition-colors shadow-lg"
                title="Adicionar avatar"
              >
                <CameraIcon />
              </motion.button>
            )}
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-semibold text-white">
            {sessionAny?.user?.name ?? "Usuário"}
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-gray-400 mb-4">
            {sessionAny?.user?.email ?? "—"}
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer bg-[#0e00d0] text-white px-4 py-2 rounded mb-4 hover:bg-blue-700 font-medium w-full"
          >
            Ver minhas estatísticas
          </motion.button>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-sm text-white">
            <span className="font-medium">Nível 19 | Ranking 1</span>
            <br />
            desde 01/01/2025
          </motion.p>
        </motion.aside>

        {/* Conteúdo Principal */}
        <section className="flex-1 w-full">
          {/* Tabs */}
          <motion.div
            className="flex gap-6 border-b border-gray-700 text-sm ml-1 md:ml-2"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {["dadosPessoais", "dadosAcesso", "assinaturas"].map((tab) => (
              <motion.button
                key={tab}
                variants={tabVariants}
                className={`cursor-pointer pb-2 ${abaAtiva === tab
                  ? "border-b-2 border-black text-black dark:border-white dark:text-white font-medium"
                  : "text-gray-800 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                  }`}
                onClick={() => setAbaAtiva(tab as "dadosPessoais" | "dadosAcesso" | "assinaturas")}
              >
                {tab === "dadosPessoais" && "Dados pessoais"}
                {tab === "dadosAcesso" && "Dados de acesso"}
                {tab === "assinaturas" && "Assinaturas"}
              </motion.button>
            ))}
          </motion.div>

          {/* Conteúdo */}
          <motion.section
            key={abaAtiva}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-gray-700 rounded-lg p-6 mt-[-1px]"
          >
            <AnimatePresence mode="wait">
              {abaAtiva === "dadosPessoais" && (
                <motion.form
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Nome */}
                  <motion.div variants={itemVariants} className="col-span-1 md:col-span-2">
                    <label className="block mb-1 text-sm text-black dark:text-gray-300">Nome *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Digite seu nome completo"
                      className="    w-full rounded p-2 bg-white text-gray-900
    placeholder-gray-400
    border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0e00d0]
    dark:bg-transparent dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
                    />
                    {errors.name && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        {errors.name}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* CPF */}
                  <motion.div variants={itemVariants}>
                    <label className="block mb-1 text-sm text-black dark:text-gray-300">CPF</label>
                    <input
                      name="cpf"
                      value={form.cpf}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="    w-full rounded p-2 bg-white text-gray-900
    placeholder-gray-400
    border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0e00d0]
    dark:bg-transparent dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
                    />
                    {errors.cpf && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        {errors.cpf}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Nascimento */}
                  <motion.div variants={itemVariants}>
                    <label className="block mb-1 text-sm text-black dark:text-gray-300">Nascimento</label>
                    <input
                      name="birth_date"
                      value={form.birth_date}
                      onChange={handleChange}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      className="    w-full rounded p-2 bg-white text-gray-900
    placeholder-gray-400
    border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0e00d0]
    dark:bg-transparent dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
                    />
                    {errors.birth_date && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        {errors.birth_date}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Gênero */}
                  <motion.div variants={itemVariants}>
                    <label className="block mb-1 text-sm text-black dark:text-gray-300">
                      Gênero
                    </label>

                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="
      w-full rounded p-2 
      bg-white text-gray-900 
      border border-gray-300
      focus:outline-none focus:ring-2 focus:ring-[#0e00d0]

      dark:bg-[#0A0F1F] dark:text-white 
      dark:border-gray-700 
      dark:focus:ring-[#4e4cff]
    "
                    >
                      <option value="">Selecione</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="nao-informar">Prefiro não dizer</option>
                    </select>
                  </motion.div>


                  {/* Celular */}
                  <motion.div variants={itemVariants}>
                    <label className="block mb-1 text-sm text-black dark:text-gray-300">Celular</label>
                    <input
                      name="celular"
                      value={form.celular}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="    w-full rounded p-2 bg-white text-gray-900
    placeholder-gray-400
    border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0e00d0]
    dark:bg-transparent dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
                    />
                    {errors.celular && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        {errors.celular}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Save */}
                  <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 flex justify-end">
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                      className="bg-[#0e00d0] cursor-pointer px-4 py-2 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
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

              {/* Dados de acesso */}
              {abaAtiva === "dadosAcesso" && (
                <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 text-sm">
                  {/* Seção de Email e Senha */}
                  <div className="space-y-4">
                    <motion.div variants={itemVariants}>
                      <p className="text-black dark:text-gray-300 mb-1 font-medium">Email:</p>
                      <p className="text-black dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50 p-2 rounded border border-gray-300 dark:border-gray-700">
                        {sessionAny?.user?.email ?? "—"}
                      </p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <p className="text-black dark:text-gray-300 mb-2 font-medium">Senha:</p>
                      <motion.button
                        onClick={() => setMostrarAlterarSenha(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer text-white bg-[#0e00d0] px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Alterar senha
                      </motion.button>
                    </motion.div>
                  </div>

                  <div className="border-t border-gray-300 dark:border-gray-700 my-4"></div>

                  {/* Seção de Login Social */}
                  <motion.div variants={itemVariants} className="space-y-3">
                    <h3 className="text-black dark:text-white font-medium text-base">Login Social</h3>

                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                      Habilite o login com o Google se o e-mail da sua conta Google for o mesmo do seu cadastro atual ({sessionAny?.user?.email}).
                    </p>

                    {/* BOTÃO GOOGLE */}
                    <motion.button
                      onClick={!isGoogle ? handleGoogleLink : undefined}
                      disabled={isGoogle}
                      whileHover={!isGoogle ? { scale: 1.02 } : {}}
                      whileTap={!isGoogle ? { scale: 0.98 } : {}}
                      className={`
      flex items-center gap-3 px-4 py-2 rounded-lg border shadow-sm transition-all 
      ${isGoogle
                          ? "bg-green-500 border-green-600 text-white cursor-not-allowed shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer dark:bg-[#1b1f27] dark:border-gray-600 dark:text-white dark:hover:bg-[#252a35]"
                        }
    `}
                    >
                      {/* Ícone Google */}
                      <svg
                        width="18"
                        height="18"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className={`${isGoogle ? "opacity-80" : ""}`}
                      >
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                      </svg>

                      <span className="font-medium">
                        {isGoogle ? "Conta Google conectada!" : "Conectar conta Google"}
                      </span>
                    </motion.button>

                    {/* REMOVER GOOGLE */}
                    {isGoogle && (
                      <button
                        onClick={handleUnlinkGoogle}
                        className="cursor-pointer text-red-600 dark:text-red-400 text-sm underline hover:text-red-700 transition-all"
                      >
                        Remover vinculação com Google
                      </button>
                    )}
                  </motion.div>


                </motion.div>
              )}

              {/* Assinaturas */}
              {abaAtiva === "assinaturas" && (
                <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col items-center justify-center text-center space-y-4">
                  <motion.p variants={itemVariants} className="text-white font-medium">
                    Nenhuma assinatura cadastrada.
                  </motion.p>

                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer bg-[#0e00d0] text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    Ir para cursos
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </section>
      </main>

      {/* Modal Alterar Senha - implementado sem shadcn/ui */}
      <AnimatePresence>
        {mostrarAlterarSenha && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="bg-[#00091A] border border-gray-700 rounded-lg p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => {
                  setMostrarAlterarSenha(false);
                  setErrors((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
                }}
                className="cursor-pointer absolute top-2 right-2 text-white text-xl hover:text-[#D0004C]"
              >
                &times;
              </button>

              <h2 className="text-white font-semibold text-lg mb-1">Alterar senha</h2>
              <p className="text-gray-400 text-sm mb-4">Digite uma nova senha para alterar a atual.</p>

              <div className="mb-4">
                <label className="block text-sm text-white font-semibold mb-1">Nova senha</label>
                <input
                  type="password"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    SetNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: "" }));
                  }}
                  className="w-full p-2 bg-transparent border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#0e00d0]"
                />
                {errors.newPassword && (
                  <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm text-white font-semibold mb-1">Confirmar nova senha</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    SetConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  className="w-full p-2 bg-transparent border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#0e00d0]"
                />
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: isChangingPassword ? 1 : 1.02 }}
                whileTap={{ scale: isChangingPassword ? 1 : 0.98 }}
                onClick={handleSetPassword}
                disabled={isChangingPassword}
                className="bg-[#D0004C] cursor-pointer text-white px-4 py-2 rounded hover:bg-[#0e00d0] w-full disabled:opacity-60"
              >
                {isChangingPassword ? "Alterando..." : "Alterar senha"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup genérico (sucesso / erro) */}
      <AnimatePresence>
        {popup.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto w-full max-w-sm bg-white dark:bg-[#0b1220] border border-gray-700 rounded-2xl shadow-2xl p-4"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{popup.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{popup.message}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setPopup({ ...popup, open: false })}
                    className="px-3 py-2 bg-[#0e00d0] text-white rounded-md"
                  >
                    OK
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {editingImageFile && (
        <ProfileEditorModal
          image={editingImageFile}
          open={!!editingImageFile}
          onOpenChange={(isOpen) => !isOpen && setEditingImageFile(null)}
          onConfirm={handleSaveAvatar}
        />
      )}
    </div>
  );
}
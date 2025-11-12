"use client";

import { useEffect } from "react";
import { useProgressBar } from "@/components/Context/ProgressBarContext";
import { NavBarComponent } from "@/components/NavBarComponent/NavBarComponent";
import LogoutButton from "@/components/LogoutButton";

interface Props {
  session: any; // Pode tipar com Session se quiser
}

export default function HomeClient({ session }: Props) {
  const { done } = useProgressBar();

  useEffect(() => {
    done();
  }, []);

  return (
    <div>
      <NavBarComponent />
      <div className="bg-[#030B1A] min-h-screen text-white flex items-center justify-center px-4">
        <div className="w-full max-w-7xl space-y-12">
          {/* Header do usuário */}
          <div className="bg-[#1E1E1E] rounded-md p-4 flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-xl font-semibold" />
            <span className="text-lg font-semibold">Bem-vindo, {session.user?.name}</span>
            <span className="text-2xl font-semibold">{session.user?.email}</span>
            <img
              src={session.user?.image ?? "/default-avatar.png"}
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
            <p><LogoutButton laravelToken={session.laravelToken as string} /></p>
          </div>

          {/* Continuar assistindo */}
          <section>
            <h2 className="text-xl font-bold mb-4">Continuar assistindo</h2>
            <div className="flex gap-4">
              <div className="w-64 h-36 bg-gray-800 rounded-md relative overflow-hidden">
                <img
                  src="/capa-aula01.jpg"
                  alt="Princípios de Matemática Básica: Aula 01"
                  className="w-full h-full object-cover rounded-md"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-sm">
                  Princípios de Matemática Básica: Aula 01
                </div>
              </div>
            </div>
          </section>

          {/* Cursos disponíveis */}
          <section>
            <h2 className="text-xl font-bold mb-4">Cursos disponíveis</h2>
            <div className="flex gap-4">
              {["curso-1.jpg", "curso-2.jpg"].map((img, i) => (
                <div key={i} className="w-64 h-40 bg-gray-800 rounded-md overflow-hidden relative">
                  <img
                    src={`/${img}`}
                    alt={`Curso ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 bg-black/60 p-2 w-full text-sm">
                    {i === 0 ? "Princípios de Matemática Básica" : "Princípios de Matemática Elementar"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Metas */}
          <section>
            <h2 className="text-xl font-bold mb-4">Minhas metas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1E1E1E] rounded-md p-4">
                <p className="text-sm text-gray-400">Dias de estudo seguidos</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <div className="bg-[#1E1E1E] rounded-md p-4">
                <p className="text-sm text-gray-400">Essa semana</p>
                <p className="text-2xl font-bold">3 aulas</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

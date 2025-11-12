"use client";

import { useEffect, useState } from "react";
import { useProgressBar } from "@/components/Context/ProgressBarContext";
import LogoutButton from "@/components/LogoutButton";
import { useSession } from "next-auth/react";
import HomeSkeleton from "@/components/Skeletons/HomeSkeleton";
import { motion } from 'framer-motion'
import BannerCarousel from '@/components/home/BannerCarousel'
import UserCard from '@/components/home/UserCard'
import ContinueWatching from '@/components/home/ContinueWatching'
import CoursesSection from '@/components/home/CoursesSection'
import GoalsSection from '@/components/home/metricas/GoalsSection'
import WeekProgress from '@/components/home/metricas/WeekProgress'
import MyLists from '@/components/home/metricas/MyLists'
import MetricsSection from '@/components/home/metricas/MetricsSection'


export default function HomePage() {
  const { done } = useProgressBar();
  const { data: session, status } = useSession();

  // const [dashboardData, setDashboardData] = useState(null);

  // Controla o loading enquanto a sessão ou dados ainda não chegaram
  const isLoading = status === "loading";

  useEffect(() => {
    done();
  }, []);

  // useEffect(() => {
  //     done();
  //   const fetchDashboardData = async () => {
  //     // apiClient já está autenticado, mas precisamos esperar a sessão
  //     if (status === "authenticated") { 
  //       try {
  //         const response = await apiClient.get('/dashboard');
  //         setDashboardData(response.data);
  //       } catch (error) {
  //         console.error("Falha ao buscar dados do dashboard:", error);
  //       }
  //     }
  //   };

  //   fetchDashboardData();
  // }, [status, apiClient, done]);




  if (isLoading) {
    return <HomeSkeleton />;
  }

  const items = [
    {
      id: 1,
      name: "Princípios de Matemática Básica: Aula 01",
      content_avatar: "https://cdn.fisiquei.com.br/lesson-attachments/example.png"
    },
  ]
  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 dark:bg-[#00091A] dark:text-white px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <BannerCarousel />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6"
        >
          <UserCard nome={session?.user?.name ?? null} />
        </motion.div>

        <section className="mt-12 space-y-12">
          <ContinueWatching items={items} />
            <CoursesSection />
        </section>
      </div>

      <section>
        <div className="max-w-7xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <GoalsSection />
            <WeekProgress />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <MyLists />
            <MetricsSection />
          </motion.div>
        </div>
      </section>

    </main>


  )



  // return (
  //   <>
  //     <div className="bg-[#1E1E1E] rounded-md p-4 flex items-center space-x-4">
  //       <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-xl font-semibold" />
  //       <span className="text-lg font-semibold">Bem-vindo, {session?.user?.name}</span>
  //       <span className="text-2xl font-semibold">{session?.user?.email}</span>
  //       <img
  //         src={session?.user?.image ?? "/default-avatar.png"}
  //         alt="Avatar"
  //         className="w-10 h-10 rounded-full"
  //       />
  //       <p><LogoutButton laravelToken={session?.laravelToken as string} /></p>
  //     </div>

  //     {/* Continuar assistindo */}
  //     <section>
  //       <h2 className="text-xl font-bold mb-4">Continuar assistindo</h2>
  //       <div className="flex gap-4">
  //         <div className="w-64 h-36 bg-gray-800 rounded-md relative overflow-hidden">
  //           <img
  //             src="/capa-aula01.jpg"
  //             alt="Princípios de Matemática Básica: Aula 01"
  //             className="w-full h-full object-cover rounded-md"
  //           />
  //           <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-sm">
  //             Princípios de Matemática Básica: Aula 01
  //           </div>
  //         </div>
  //       </div>
  //     </section>

  //     {/* Cursos disponíveis */}
  //     <section>
  //       <h2 className="text-xl font-bold mb-4">Cursos disponíveis</h2>
  //       <div className="flex gap-4">
  //         {["curso-1.jpg", "curso-2.jpg"].map((img, i) => (
  //           <div key={i} className="w-64 h-40 bg-gray-800 rounded-md overflow-hidden relative">
  //             <img
  //               src={`/${img}`}
  //               alt={`Curso ${i + 1}`}
  //               className="w-full h-full object-cover"
  //             />
  //             <div className="absolute bottom-0 bg-black/60 p-2 w-full text-sm">
  //               {i === 0 ? "Princípios de Matemática Básica" : "Princípios de Matemática Elementar"}
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </section>

  //     {/* Metas */}
  //     <section>
  //       <h2 className="text-xl font-bold mb-4">Minhas metas</h2>
  //       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  //         <div className="bg-[#1E1E1E] rounded-md p-4">
  //           <p className="text-sm text-gray-400">Dias de estudo seguidos</p>
  //           <p className="text-2xl font-bold">5</p>
  //         </div>
  //         <div className="bg-[#1E1E1E] rounded-md p-4">
  //           <p className="text-sm text-gray-400">Essa semana</p>
  //           <p className="text-2xl font-bold">3 aulas</p>
  //         </div>
  //       </div>
  //     </section>
  //   </>
  // );
}

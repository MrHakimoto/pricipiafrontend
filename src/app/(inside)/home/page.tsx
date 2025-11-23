// app/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProgressBar } from "@/components/Context/ProgressBarContext";
import LogoutButton from "@/components/LogoutButton";
import { useSession } from "next-auth/react";
import HomeSkeleton from "@/components/Skeletons/HomeSkeleton";
import { motion } from 'framer-motion'
import BannerCarousel from '@/components/home/BannerCarousel'
import UserCard from '@/components/home/UserCard'
import CoursesSection from '@/components/home/CoursesSection'
import GoalsSection from '@/components/home/metricas/GoalsSection'
import WeekProgress from '@/components/home/metricas/WeekProgress'
import MyLists from '@/components/home/metricas/MyLists'
import MetricsSection from '@/components/home/metricas/MetricsSection'
import { FooterHome } from '@/components/home/FooterHome'
import ContinueWatchingCard from '@/components/home/ContinueWatchingCard';
import { fetchStudentStats, type StudentStats } from "@/lib/dashboard/stats";

export default function HomePage() {
  const { done } = useProgressBar();
  const { data: session, status } = useSession();
  const [continueWatching, setContinueWatching] = useState(null);
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    console.log(session)
    const fetchContinueWatching = async () => {
      try {
        const response = await fetch('/api/dashboard/continuar-assistindo');
        if (response.ok) {
          const data = await response.json();
          setContinueWatching(data);
        }
      } catch (error) {
        console.error('Erro ao buscar continuar assistindo:', error);
      }
    };

    fetchContinueWatching();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (session?.laravelToken) {
        try {
          setLoadingStats(true)
          const data = await fetchStudentStats(session.laravelToken)
          setStats(data)
        } catch (error) {
          console.error('Erro ao carregar stats:', error)
        } finally {
          setLoadingStats(false)
        }
      }
    }
    
    if (status === "authenticated") {
      loadStats()
    }
  }, [session?.laravelToken, status])

  const isLoading = status === "loading" || loadingStats;

  useEffect(() => {
    done();
  }, []);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <>
      <main className="min-h-screen bg-[#F6F6F6] text-gray-900 dark:bg-[#00091A] dark:text-white px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <BannerCarousel />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6"
          >
            <UserCard
              nome={session?.user?.name ?? null}
              token={session?.laravelToken as string}
            />
          </motion.div>

          <section className="mt-12 space-y-12">
            <div className="flex gap-6">
              <WeekProgress />
              {/* <ContinueWatchingCard /> */}
            </div>
           
          </section>
        </div>

        {/* <section className="mt-12">
          <div className="max-w-7xl mx-auto space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <MyLists
                totalListas={stats?.listas?.total_listas_concluidas}
                totalSimulados={stats?.listas?.total_simulados}
              />
              <MetricsSection
                acertos={stats?.acertos?.acertos}
                erros={stats?.acertos?.erros}
                total={stats?.acertos?.total}
                taxaAcerto={stats?.acertos?.taxa_acerto}
              />
            </motion.div>
          </div>
        </section> */}
      </main>
      <FooterHome />
    </>
  )
}
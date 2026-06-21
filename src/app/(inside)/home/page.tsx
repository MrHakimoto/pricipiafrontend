// app/(inside)/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProgressBar } from "@/components/Context/ProgressBarContext";
import { useSession } from "next-auth/react";
import HomeSkeleton from "@/components/Skeletons/HomeSkeleton";
import { motion } from "framer-motion";
import BannerCarousel from "@/components/home/BannerCarousel";
import UserCard from "@/components/home/UserCard";
import WeekProgress from "@/components/home/metricas/WeekProgress";
import MyLists from "@/components/home/metricas/MyLists";
import MetricsSection from "@/components/home/metricas/MetricsSection";
import { FooterHome } from "@/components/home/FooterHome";
import ContinueWatchingCard from "@/components/home/ContinueWatchingCard";
import { getHomeStats, type HomeStats } from "@/lib/dashboard/homeStats";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function HomePage() {
  const { done } = useProgressBar();
  const { data: session, status } = useSession();

  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useDocumentTitle("Home");

  useEffect(() => {
    done();
  }, [done]);

  useEffect(() => {
    const loadStats = async () => {
      if (status === "loading") return;

      if (status !== "authenticated" || !session?.laravelToken) {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        const data = await getHomeStats(session.laravelToken);
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar stats:", error);
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [session?.laravelToken, status]);

  const isLoading = status === "loading" || loadingStats;

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <>
      <main className="min-h-screen bg-[#F6F6F6] px-4 pb-20 pt-4 text-gray-950 dark:bg-[#00091A] dark:text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <BannerCarousel />

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <UserCard
              nome={session?.user?.name ?? null}
              token={session?.laravelToken as string}
            />
          </motion.section>

          <section className="mt-8">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
              <WeekProgress />

              <div className="space-y-5">
                <ContinueWatchingCard />
              </div>
            </div>
          </section>

          {stats && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.45 }}
              className="grid grid-cols-1 gap-5 lg:grid-cols-2"
            >
              <MyLists dados={stats.listas_stats} />
              <MetricsSection dados={stats.questoes_stats} />
            </motion.section>
          )}
        </div>
      </main>

      <FooterHome />
    </>
  );
}

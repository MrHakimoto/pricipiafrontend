// app/(inside)/metricas/page.tsx

import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";
import { PerformanceDashboard } from "@/components/metricas/metricas";

const MetricasPage = () => {
  return (
    <main className="min-h-screen bg-[#F6F6F6] px-4 py-6 dark:bg-[#00091A] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <GamificationDashboard />

        <PerformanceDashboard />
      </div>
    </main>
  );
};

export default MetricasPage;
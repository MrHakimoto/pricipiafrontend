// components/home/UserCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Star, Trophy } from "lucide-react";
import Link from "next/link";
import UserAvatar from "../UserAvatar";
import { AnimatedRoleName } from "@/components/user/AnimatedRoleName";
import {
  UserStatus,
  getGamificationStatus,
  getLeaderboard,
} from "@/lib/gamification/gamification";
import { getMyRoles, type UserRole } from "@/lib/users/roles";
import { getLevelTitle } from "@/lib/gamification/levels";

type Props = {
  nome: string | null;
  token: string;
};

function UserCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white px-5 py-6 shadow-sm dark:border-white/10 dark:bg-[#020817] sm:px-8">
      <div className="animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="space-y-3">
            <div className="h-5 w-40 rounded bg-gray-200 dark:bg-white/10" />
            <div className="h-4 w-56 rounded bg-gray-200 dark:bg-white/10" />
            <div className="h-2 w-72 max-w-full rounded-full bg-gray-200 dark:bg-white/10" />
          </div>
        </div>

        <div className="mt-5 h-14 rounded-2xl bg-gray-200 dark:bg-white/10 lg:ml-auto lg:w-[460px]" />
      </div>
    </div>
  );
}

export default function UserCard({ nome, token }: Props) {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<UserRole | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserCardData() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [statusData, leaderboardData, rolesData] = await Promise.all([
          getGamificationStatus(token),
          getLeaderboard(token),
          getMyRoles(token).catch(() => null),
        ]);

        setStatus(statusData);
        setMyRank(leaderboardData.my_rank);

        const roles = Array.isArray(rolesData?.roles) ? rolesData.roles : [];

        setUserRoles(roles);
        setPrimaryRole(rolesData?.role ?? roles[0] ?? null);
      } catch (error) {
        console.error("Erro ao carregar dados do card do usuário:", error);

        setStatus(null);
        setMyRank(null);
        setUserRoles([]);
        setPrimaryRole(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserCardData();
  }, [token]);

  if (loading) {
    return <UserCardSkeleton />;
  }

const level = status?.level ?? 1;
const levelTitle = status?.rank_title ?? getLevelTitle(level);
  const streak = status?.streak ?? 0;
  const points = status?.points ?? 0;

  const progress = Math.min(
    100,
    Math.max(0, Math.round(status?.progress_percentage ?? 0)),
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#020817]">
      <div className="relative px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <div className="flex shrink-0 flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0E00D0] ring-2 ring-[#0E00D0] ring-offset-2 ring-offset-white dark:ring-offset-[#020817] sm:h-[74px] sm:w-[74px]">
                  <UserAvatar className="h-[74px] w-[74px]" />
                </div>

                <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                  Nível {level}
                </span>
              </div>

              <div className="min-w-0 flex-1 pt-1">
                <h3 className="truncate text-xl font-bold leading-tight text-gray-950 dark:text-white sm:text-2xl">
                  <AnimatedRoleName
                    name={nome || "Aluno"}
                    roles={userRoles}
                    role={primaryRole}
                    level={level}
                    levelTitle={levelTitle}
                    nameClassName="text-xl sm:text-2xl"
                  />
                </h3>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {status
                    ? `${levelTitle} • ${streak} dias de ofensiva`
                    : "Continue sua jornada no Principia"}
                </p>

                <div className="mt-3 w-full max-w-[390px]">
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                    <span>Nível {level}</span>
                    <span>{progress}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-[#0E00D0] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl bg-[#eeeeee] p-3 dark:bg-[#1B1F27] lg:w-auto">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#0E00D0] px-2 text-xs font-black text-white">
                  {points}π
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>Nível {level}</span>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>Rank #{myRank ?? "?"}</span>
              </div>

              <Link
                href="/perfil"
                className="inline-flex items-center justify-center rounded-xl bg-gray-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Meu Perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
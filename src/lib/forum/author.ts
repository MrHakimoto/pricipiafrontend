import { getLevelTitle } from "@/lib/gamification/levels";

export type ForumRole = {
  id: number;
  name: string;
  slug: string;
  display_name?: string | null;
  description?: string | null;
  priority?: number | null;
  is_staff?: boolean | number | null;
  is_active?: boolean | number | null;
};

export type ForumAuthorGamification = {
  user_id?: number | null;
  current_points?: number | null;
  current_level?: number | null;
  current_streak?: number | null;

  /**
   * Pode vir do backend, mas não deve ser obrigatório.
   * Se não vier, o frontend calcula pelo mapa central.
   */
  level_title?: string | null;
};

export type ForumAuthor = {
  id: number;
  name: string;
  email?: string | null;
  avatar?: string | null;
  roles?: ForumRole[];
  role?: ForumRole | null;
  gamification?: ForumAuthorGamification | null;
};

export function getAuthorRoles(author?: ForumAuthor | null): ForumRole[] {
  if (!Array.isArray(author?.roles)) return [];

  return [...author.roles].sort(
    (a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0),
  );
}

export function getAuthorPrimaryRole(author?: ForumAuthor | null): ForumRole | null {
  return author?.role ?? getAuthorRoles(author)[0] ?? null;
}

export function getAuthorLevel(author?: ForumAuthor | null): number {
  const level = Number(author?.gamification?.current_level ?? 1);

  if (!Number.isFinite(level) || level < 1) {
    return 1;
  }

  return level;
}

export function getAuthorLevelTitle(author?: ForumAuthor | null): string {
  return (
    author?.gamification?.level_title ??
    getLevelTitle(getAuthorLevel(author))
  );
}
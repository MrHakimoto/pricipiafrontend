// useModuloStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CurrentLink {
  course_id: number;
  course_name: string;
  frente_id: number;
  frente_name: string;
  module_name: string;
}

export interface UserProgress {
  id?: number;
  user_id?: number;
  course_content_id?: number;

  /**
   * Campo legado usado pelo front antigo.
   */
  last_watched_timestamp?: number | null;

  /**
   * Campos atuais vindos do backend.
   */
  last_watched_seconds?: number | null;
  last_watched_at?: string | null;
  duration_seconds?: number | null;

  is_completed?: boolean;
  completed_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface Content {
  id: number;
  title: string;
  content_type: "aula" | "lista";

  content_url?: string | null;
  duration_in_seconds?: number | null;
  list_id?: number | null;
  description?: string | null;
  attachments?: any[];

  /**
   * Campos de ordenação que podem vir do backend em formatos diferentes.
   */
  order?: number | null;
  ordem?: number | null;
  position?: number | null;
  pivot?: {
    order?: number | null;
    ordem?: number | null;
    position?: number | null;
    [key: string]: any;
  } | null;

  user_progress?: UserProgress | null;
}

interface ModuloStore {
  // Estados para carregamento inteligente
  isFirstLoad: boolean;
  currentContentType: "aula" | "lista" | null;

  // Estados existentes
  contents: Content[];
  currentContentId: number | null;

  initialLoading: boolean;
  showAside: boolean;
  currentLink: CurrentLink | null;
  loadedModuloId: string | null;

  // Ações
  setIsFirstLoad: (val: boolean) => void;
  setCurrentContentType: (type: "aula" | "lista" | null) => void;
  completeFirstLoad: () => void;

  setContents: (contents: Content[]) => void;
  setCurrentContentId: (id: number | null) => void;
  goToLesson: (lesson: Content) => void;
  setInitialLoading: (val: boolean) => void;
  setShowAside: (val: boolean) => void;
  setCurrentLink: (data: CurrentLink | null) => void;
  setLoadedModuloId: (id: string | null) => void;
  resetModulo: () => void;

  // Progresso de aula
  updateLessonProgress: (contentId: number, timestamp: number) => void;
  markLessonAsCompleted: (contentId: number) => void;
  markLessonAsUncompleted: (contentId: number) => void;
  getCurrentLesson: () => Content | undefined;
  getLessonProgress: (contentId: number) => UserProgress | null;
}

function normalizeTimestamp(value: number | null | undefined): number {
  const timestamp = Number(value ?? 0);

  if (!Number.isFinite(timestamp) || timestamp < 0) {
    return 0;
  }

  return Math.floor(timestamp);
}

function getCurrentProgressSeconds(progress?: UserProgress | null): number {
  return normalizeTimestamp(
    progress?.last_watched_seconds ?? progress?.last_watched_timestamp ?? 0,
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

export const useModuloStore = create<ModuloStore>()(
  persist(
    (set, get) => ({
      isFirstLoad: true,
      currentContentType: null,

      contents: [],
      currentContentId: null,
      initialLoading: true,
      showAside: true,
      currentLink: null,
      loadedModuloId: null,

      setIsFirstLoad: (val: boolean) => {
        console.log("Store: setIsFirstLoad", val);
        set({ isFirstLoad: val });
      },

      setCurrentContentType: (type: "aula" | "lista" | null) => {
        console.log("Store: setCurrentContentType", type);
        set({ currentContentType: type });
      },

      completeFirstLoad: () => {
        const state = get();
        const currentContent = state.contents.find(
          (content) => content.id === state.currentContentId,
        );

        const contentType = currentContent?.content_type || null;

        console.log("Store: completeFirstLoad - Tipo detectado:", contentType);

        set({
          isFirstLoad: false,
          currentContentType: contentType,
        });
      },

      setContents: (data: Content[]) => {
        console.log("Store: setContents", data.length, "itens");
        set({ contents: data });
      },

      setCurrentContentId: (id: number | null) => {
        console.log("Store: setCurrentContentId", id);
        set({ currentContentId: id });
      },

      goToLesson: (lesson: Content) => {
        const state = get();
        const { currentLink } = state;

        if (!currentLink) {
          console.error("Store: goToLesson - currentLink não disponível");
          return;
        }

        console.log(
          "Store: goToLesson - Navegando para:",
          lesson.id,
          lesson.title,
        );

        set({
          currentContentId: lesson.id,
          currentContentType: lesson.content_type,
        });
      },

      setInitialLoading: (val: boolean) => set({ initialLoading: val }),

      setShowAside: (val: boolean) => set({ showAside: val }),

      setCurrentLink: (data: CurrentLink | null) => {
        console.log("Store: setCurrentLink", data);
        set({ currentLink: data });
      },

      setLoadedModuloId: (id: string | null) => {
        console.log("Store: setLoadedModuloId", id);
        set({ loadedModuloId: id });
      },

      resetModulo: () => {
        console.log("Store: resetModulo - limpando dados");

        set({
          isFirstLoad: true,
          currentContentType: null,
          contents: [],
          currentContentId: null,
          currentLink: null,
          loadedModuloId: null,
          initialLoading: true,
          showAside: true,
        });
      },

      updateLessonProgress: (contentId: number, timestamp: number) => {
        const state = get();
        const safeTimestamp = normalizeTimestamp(timestamp);
        const watchedAt = nowIso();

        console.log(
          "Store: updateLessonProgress",
          contentId,
          safeTimestamp,
          "segundos",
        );

        const updatedContents = state.contents.map((content) =>
          content.id === contentId
            ? {
                ...content,
                user_progress: {
                  ...content.user_progress,
                  last_watched_timestamp: safeTimestamp,
                  last_watched_seconds: safeTimestamp,
                  last_watched_at: watchedAt,
                  duration_seconds:
                    content.user_progress?.duration_seconds ??
                    content.duration_in_seconds ??
                    null,
                  is_completed: content.user_progress?.is_completed ?? false,
                },
              }
            : content,
        );

        set({ contents: updatedContents });
      },

      markLessonAsCompleted: (contentId: number) => {
        const state = get();
        const completedAt = nowIso();

        console.log("Store: markLessonAsCompleted", contentId);

        const updatedContents = state.contents.map((content) => {
          if (content.id !== contentId) return content;

          const watchedSeconds = getCurrentProgressSeconds(
            content.user_progress,
          );

          return {
            ...content,
            user_progress: {
              ...content.user_progress,
              last_watched_timestamp: watchedSeconds,
              last_watched_seconds: watchedSeconds,
              last_watched_at:
                content.user_progress?.last_watched_at ?? completedAt,
              duration_seconds:
                content.user_progress?.duration_seconds ??
                content.duration_in_seconds ??
                null,
              is_completed: true,
              completed_at: content.user_progress?.completed_at ?? completedAt,
            },
          };
        });

        set({ contents: updatedContents });
      },

      markLessonAsUncompleted: (contentId: number) => {
        const state = get();
        const watchedAt = nowIso();

        console.log("Store: markLessonAsUncompleted", contentId);

        const updatedContents = state.contents.map((content) => {
          if (content.id !== contentId) return content;

          const watchedSeconds = getCurrentProgressSeconds(
            content.user_progress,
          );

          return {
            ...content,
            user_progress: {
              ...content.user_progress,
              last_watched_timestamp: watchedSeconds,
              last_watched_seconds: watchedSeconds,
              last_watched_at: watchedAt,
              duration_seconds:
                content.user_progress?.duration_seconds ??
                content.duration_in_seconds ??
                null,
              is_completed: false,
              completed_at: null,
            },
          };
        });

        set({ contents: updatedContents });
      },

      getCurrentLesson: () => {
        const state = get();

        return state.contents.find(
          (content) => content.id === state.currentContentId,
        );
      },

      getLessonProgress: (contentId: number) => {
        const state = get();
        const content = state.contents.find((item) => item.id === contentId);

        return content?.user_progress || null;
      },
    }),
    {
      name: "modulo-store",
      partialize: (state) => ({
        isFirstLoad: state.isFirstLoad,
        currentContentType: state.currentContentType,
        loadedModuloId: state.loadedModuloId,
        currentContentId: state.currentContentId,
        currentLink: state.currentLink,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error("Erro ao reidratar store:", error);
          } else {
            console.log("Store reidratado:", {
              isFirstLoad: state?.isFirstLoad,
              currentContentType: state?.currentContentType,
              loadedModuloId: state?.loadedModuloId,
              currentContentId: state?.currentContentId,
              contentsCount: state?.contents.length,
            });
          }
        };
      },
    },
  ),
);
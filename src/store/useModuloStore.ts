//useModuloStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CurrentLink {
  course_id: number;
  course_name: string;
  frente_id: number;
  frente_name: string;
  module_name: string;
}

interface UserProgress {
  last_watched_timestamp: number;
  is_completed: boolean;
}

interface Content {
  id: number;
  title: string;
  content_type: 'aula' | 'lista';
  content_url?: string;
  duration_in_seconds?: number;
  list_id?: number;
  description?: string;
  attachments?: any[];
  user_progress?: UserProgress | null;
}

interface ModuloStore {
  // 🔥 NOVOS ESTADOS PARA CARREGAMENTO INTELIGENTE
  isFirstLoad: boolean;
  currentContentType: "aula" | "lista" | null;
  
  // ESTADOS EXISTENTES
  contents: Content[];
  currentContentId: number | null;
  
  initialLoading: boolean;
  showAside: boolean;
  currentLink: CurrentLink | null;
  loadedModuloId: string | null;

  // 🔥 NOVAS AÇÕES
  setIsFirstLoad: (val: boolean) => void;
  setCurrentContentType: (type: "aula" | "lista" | null) => void;
  completeFirstLoad: () => void;
  
  // AÇÕES EXISTENTES
  setContents: (contents: Content[]) => void;
  setCurrentContentId: (id: number | null) => void;
  goToLesson: (lesson: any) => void;
  setInitialLoading: (val: boolean) => void;
  setShowAside: (val: boolean) => void;
  setCurrentLink: (data: CurrentLink | null) => void;
  setLoadedModuloId: (id: string | null) => void;
  resetModulo: () => void;
  
  // 🔥 NOVAS AÇÕES PARA PROGRESSO DE AULA
  updateLessonProgress: (contentId: number, timestamp: number) => void;
  markLessonAsCompleted: (contentId: number) => void;
  markLessonAsUncompleted: (contentId: number) => void;
  getCurrentLesson: () => Content | undefined;
  getLessonProgress: (contentId: number) => UserProgress | null;
}

// Função auxiliar para criar slugs
const toSlug = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

export const useModuloStore = create<ModuloStore>()(
  persist(
    (set, get) => ({
      // 🔥 NOVOS ESTADOS INICIAIS
      isFirstLoad: true,
      currentContentType: null,

      // ESTADOS EXISTENTES
      contents: [],
      currentContentId: null,
      initialLoading: true,
      showAside: true,
      currentLink: null,
      loadedModuloId: null,

      // 🔥 NOVAS AÇÕES
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
        const currentContent = state.contents.find(c => c.id === state.currentContentId);
        const contentType = currentContent?.content_type || null;
        
        console.log("Store: completeFirstLoad - Tipo detectado:", contentType);
        
        set({ 
          isFirstLoad: false,
          currentContentType: contentType
        });
      },

      // AÇÕES EXISTENTES
      setContents: (data) => {
        console.log("Store: setContents", data.length, "itens");
        set({ contents: data });
      },

      setCurrentContentId: (id) => {
        console.log("Store: setCurrentContentId", id);
        set({ currentContentId: id });
      },

      goToLesson: (lesson: any) => {
        const state = get();
        const { currentLink } = state;
        
        if (!currentLink) {
          console.error("Store: goToLesson - currentLink não disponível");
          return;
        }

        console.log("Store: goToLesson - Navegando para:", lesson.id, lesson.title);
        
        // Atualiza o conteúdo atual e detecta tipo
        const newContentType = lesson.content_type;
        set({ 
          currentContentId: lesson.id,
          currentContentType: newContentType
        });
      },

      setInitialLoading: (val) => set({ initialLoading: val }),

      setShowAside: (val) => set({ showAside: val }),

      setCurrentLink: (data) => {
        console.log("Store: setCurrentLink", data);
        set({ currentLink: data });
      },

      setLoadedModuloId: (id) => {
        console.log("Store: setLoadedModuloId", id);
        set({ loadedModuloId: id });
      },

      resetModulo: () => {
        console.log("Store: resetModulo - limpando dados");
        set({
          // 🔥 RESETA TUDO INCLUINDO NOVOS ESTADOS
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

      // 🔥 NOVAS AÇÕES PARA PROGRESSO DE AULA
      updateLessonProgress: (contentId: number, timestamp: number) => {
        const state = get();
        console.log("Store: updateLessonProgress", contentId, timestamp, "segundos");
        
        const updatedContents = state.contents.map(content => 
          content.id === contentId 
            ? {
                ...content,
                user_progress: {
                  ...content.user_progress,
                  last_watched_timestamp: Math.floor(timestamp),
                  is_completed: content.user_progress?.is_completed || false
                }
              }
            : content
        );

        set({ contents: updatedContents });
      },

      markLessonAsCompleted: (contentId: number) => {
        const state = get();
        console.log("Store: markLessonAsCompleted", contentId);
        
        const updatedContents = state.contents.map(content => 
          content.id === contentId 
            ? {
                ...content,
                user_progress: {
                  last_watched_timestamp: content.user_progress?.last_watched_timestamp || 0,
                  is_completed: true
                }
              }
            : content
        );

        set({ contents: updatedContents });
      },

      markLessonAsUncompleted: (contentId: number) => {
        const state = get();
        console.log("Store: markLessonAsUncompleted", contentId);
        
        const updatedContents = state.contents.map(content => 
          content.id === contentId 
            ? {
                ...content,
                user_progress: {
                  last_watched_timestamp: content.user_progress?.last_watched_timestamp || 0,
                  is_completed: false
                }
              }
            : content
        );

        set({ contents: updatedContents });
      },

      getCurrentLesson: () => {
        const state = get();
        return state.contents.find(content => content.id === state.currentContentId);
      },

      getLessonProgress: (contentId: number) => {
        const state = get();
        const content = state.contents.find(c => c.id === contentId);
        return content?.user_progress || null;
      }
    }),
    {
      name: "modulo-store",
      partialize: (state) => ({
        // 🔥 PERSISTE OS NOVOS ESTADOS TAMBÉM
        isFirstLoad: state.isFirstLoad,
        currentContentType: state.currentContentType,
        // Não persiste contents para evitar dados desatualizados
        // contents: state.contents,
        loadedModuloId: state.loadedModuloId,
        currentContentId: state.currentContentId,
        currentLink: state.currentLink,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Erro ao reidratar store:', error);
          } else {
            console.log('Store reidratado:', {
              isFirstLoad: state?.isFirstLoad,
              currentContentType: state?.currentContentType,
              loadedModuloId: state?.loadedModuloId,
              currentContentId: state?.currentContentId,
              contentsCount: state?.contents.length
            });
          }
        };
      },
    }
  )
);
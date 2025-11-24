"use client";

import { BellDot, Bell, Mail, MailOpen, TriangleAlert, Loader2 } from "lucide-react"; // Removido 'Settings', Adicionado 'Loader2'
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from 'swr';

// 1. Importe TODAS as suas funções da API
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead, // Importe a função de marcar todas como lidas
  hideNotification // Manteremos esta para o futuro, se necessário
} from "@/lib/perfil/notifications"; // Ajuste o caminho se necessário

// 2. Defina os tipos de dados REAIS da API
interface ApiNotification {
  id: number;
  title: string;
  message: string | null;
  created_at: string;
  is_read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
  link_url: string | null;
}

// Chaves de cache para o SWR
const UNREAD_COUNT_KEY = '/notifications/unread-count';
const NOTIFICATIONS_LIST_KEY = '/notifications';

export function NotificationsMenu({ hoverColor = "#0E00D0" }: { hoverColor?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: session } = useSession();
  const token = session?.laravelToken;

  // --- CORREÇÃO DO TAILWIND ---
  // A cor não pode ser uma prop dinâmica, então definimos ela estaticamente
  //const hoverColor = "#0E00D0";

  // --- LÓGICA DE DADOS (SWR) ---

  // 3. BUSCAR A CONTAGEM (para o "sininho")
  // Revalida a cada 60 segundos
  const { data: countData, mutate: mutateCount } = useSWR(
    token ? [UNREAD_COUNT_KEY, token] : null,
    ([key, token]) => fetchUnreadNotificationCount(token as string),
    { refreshInterval: 60000 }
  );
  const unreadCount = countData?.unread_count || 0;

  // 4. BUSCAR A LISTA COMPLETA (só quando o dropdown estiver aberto)
  const { 
    data: allNotifications, 
    error: listError, 
    isLoading: listIsLoading,
    mutate: mutateList 
  } = useSWR(
    // Só busca se o dropdown estiver aberto E o token existir
    isOpen && token ? [NOTIFICATIONS_LIST_KEY, token] : null,
    ([key, token]) => fetchNotifications(token as string)
  );

  // 5. Filtrar as notificações (baseado nos dados da API)
  const unreadNotifications = allNotifications?.filter((n: ApiNotification) => !n.is_read) || [];
  const readNotifications = allNotifications?.filter((n: ApiNotification) => n.is_read) || [];

  // --- LÓGICA DE INTERAÇÃO ---

  // Fechar dropdown ao clicar fora (Mantido 100% igual)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper de ícone (Mantido 100% igual)
  const getIconByType = (type: string) => {
    switch (type) {
      case 'warning': return <TriangleAlert className="w-4 h-4 text-yellow-500" />;
      case 'success': return <MailOpen className="w-4 h-4 text-green-500" />;
      default: return <Mail className="w-4 h-4 text-blue-500" />;
    }
  };

  // 6. AÇÃO: Marcar UMA notificação como lida
  const handleMarkAsRead = async (notificationId: number) => {
    if (!token) return;

    // Atualização otimista (UI primeiro, depois API)
    mutateList((currentData: ApiNotification[] | undefined) => {
      if (!currentData) return [];
      return currentData.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
    }, false); // 'false' impede o SWR de re-buscar imediatamente

    mutateCount((currentCount: { unread_count: number } | undefined) => {
      if (!currentCount) return { unread_count: 0 };
      return { unread_count: Math.max(0, currentCount.unread_count - 1) };
    }, false);

    try {
      await markNotificationAsRead(notificationId, token);
      // Confirma a mutação (bom se algo falhar)
      mutateList(); 
      mutateCount();
    } catch (err) {
      console.error("Falha ao marcar como lida:", err);
      // Reverte a UI se a API falhar (não implementado aqui, mas SWR pode fazer)
    }
  };

  // 7. AÇÃO: Botão do Rodapé
  const handleFooterClick = async () => {
    if (!token) return;

    if (activeTab === 'unread') {
      // Marcar todas como lidas
      try {
        await markAllNotificationsAsRead(token);
        mutateList();
        mutateCount();
      } catch (err) {
        console.error("Falha ao marcar todas como lidas:", err);
      }
    } else {
      // Limpar lidas
      console.log("Ação 'Limpar notificações lidas' chamada.");
      // NOTA: Você precisa criar a função de API 'clearReadNotifications(token)'
      // e chamá-la aqui, seguida de mutateList() e mutateCount().
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão Trigger (Design 100% mantido, dados conectados) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300 group relative
          dark:bg-[#1F293C] hover:bg-gray-200 dark:hover:bg-[#2A374B] focus:outline-none border border-gray-300 dark:border-[#555555]
          ${isOpen ? `border border-[${hoverColor}] shadow-lg shadow-blue-500/20` : ''}
          dark:bg-[#1F293C] text-gray-700 dark:text-[#DBD9D9] hover:bg-[#2A374B] hover:border hover:border-[${hoverColor}] hover:shadow-lg hover:shadow-blue-500/20
        `}
      >
        <BellDot
          className={`w-6 h-6 lg:w-7 lg:h-7 transition-colors duration-300
    ${isOpen ? 'text-blue-600 dark:text-[#0E00D0]' : 'text-gray-700 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#0E00D0]'}`}
        />
        {unreadCount > 0 && ( // Conectado à API
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu (Design 100% mantido) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#00091A] border border-[#555555] shadow-2xl rounded-lg overflow-hidden z-50">
          {/* Header (Design 100% mantido, ícone de engrenagem removido) */}
          <div className="p-4 bg-gray-100 dark:bg-[#1F293C] border-b border-[#555555]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-black dark:text-white">Notificações</h3>
              {/* O botão de <Settings /> foi removido, como solicitado */}
            </div>

            {/* Tabs (Design 100% mantido, dados conectados) */}
            <div className="flex mt-3 bg-gray-200 dark:bg-[#0F172A] rounded-lg p-1">
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all flex-1 justify-center ${
                  activeTab === 'unread'
                    ? `bg-[${hoverColor}] text-white`
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <Bell className="w-3 h-3" />
                Não lidas ({unreadNotifications.length})
              </button>
              <button
                onClick={() => setActiveTab('read')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all flex-1 justify-center ${activeTab === 'read'
                    ? `bg-[${hoverColor}] text-white`
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <MailOpen className="w-3 h-3" />
                Lidas ({readNotifications.length})
              </button>
            </div>
          </div>

          {/* Banner push (Design 100% mantido) */}
          {/* <div className="bg-yellow-50 dark:bg-yellow-500/10 p-3 border-b border-yellow-100 dark:border-yellow-500/20 flex gap-3 border-l-4 border-l-yellow-500">
            <TriangleAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Habilite as notificações push para não perder atualizações!
              </p>
              <div className="flex gap-2">
                <button className="bg-yellow-500 text-black px-3 py-1 rounded text-xs font-medium hover:bg-yellow-400 transition-colors">
                  Habilitar agora
                </button>
                <button className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-200 text-xs transition-colors">
                  Lembrar depois
                </button>
              </div>
            </div>
          </div> */}

          {/* Lista de notificações (Design 100% mantido, dados conectados) */}
          <div className="max-h-80 overflow-y-auto">
            {listIsLoading ? (
              // Estado de Carregamento
              <div className="flex flex-col items-center justify-center p-8 gap-3 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-12 h-12 opacity-50 animate-spin" />
                <span className="text-lg font-medium">Carregando...</span>
              </div>
            ) : listError ? (
              // Estado de Erro
              <div className="flex flex-col items-center justify-center p-8 gap-3 text-red-500">
                <TriangleAlert className="w-12 h-12 opacity-50" />
                <span className="text-lg font-medium">Falha ao buscar</span>
                <span className="text-sm text-center">Tente abrir novamente.</span>
              </div>
            ) : (activeTab === 'unread' ? unreadNotifications : readNotifications).length > 0 ? (
              // Estado com Dados
              <div className="p-2 space-y-2">
                {(activeTab === 'unread' ? unreadNotifications : readNotifications).map((notification: ApiNotification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)} // Ação de clique
                    className={`p-3 rounded-lg border transition-all ${notification.is_read
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] hover:bg-gray-100 dark:hover:bg-[#1F293C]'
                        : `border-[${hoverColor}] bg-[${hoverColor}]/10 cursor-pointer hover:bg-[${hoverColor}]/20`
                    }`}
                  >
                    <div className="flex gap-3">
                      {getIconByType(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-black dark:text-white truncate">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                          {/* Formatando a data da API */}
                          {new Date(notification.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Estado Vazio (Design 100% mantido)
              <div className="flex flex-col items-center justify-center p-8 gap-3 text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 opacity-50" />
                <span className="text-lg font-medium">Nenhuma notificação</span>
                <span className="text-sm text-center">
                  {activeTab === 'unread'
                    ? 'Você não possui novas notificações.'
                    : 'Nenhuma notificação lida.'}
                </span>
              </div>
            )}
          </div>

          {/* Footer (Design 100% mantido, lógica conectada) */}
          {(unreadNotifications.length > 0 || readNotifications.length > 0) && (
            <div className="p-3 border-t border-gray-300 dark:border-[#555555] bg-gray-100 dark:bg-[#1F293C]">
              <button 
                onClick={handleFooterClick}
                className="w-full text-center text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors py-2"
              >
                {activeTab === 'unread' ? 'Marcar todas como lidas' : 'Limpar notificações lidas'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
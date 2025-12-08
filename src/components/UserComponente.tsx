//UserComponente.tsx
"use client";

import { CircleUserRound, User, Mail, LogOut, Moon, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { usePathname } from 'next/navigation';

interface UserMenuProps {
  mobile?: boolean;
  session?: {
    user: {
      name: string;
      email: string;
      image?: string;
    };
  };
  hoverColor?: string; // ✅ <-- adiciona isso
}

export function UserMenu({ mobile = false, session, hoverColor = "#0E00D0" }: UserMenuProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const user = session?.user;
  const image = user?.image;
  useEffect(() => setMounted(true), []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';
  const themeIcon = isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  const themeLabel = isDark ? 'Tema Escuro' : 'Tema Claro';

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  if (!mounted) {
    return mobile ? null : <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gray-100 dark:bg-[#1F293C]"></div>;
  }

  // === JSX MOBILE ===
  if (mobile) {
    return (
      <div className="space-y-4">
        {/* Usuário */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-[#1F293C]">
          <div className="relative flex flex-col">
            <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 dark:border-[#0E00D0] w-12 h-12">
              <span className="w-full h-full rounded-full bg-blue-600 dark:bg-[#0E00D0] flex items-center justify-center font-semibold text-white text-sm">
                {session?.user?.name ? getInitials(session.user.name) : <User className="w-5 h-5" />}
              </span>
            </span>
            <div className="absolute -bottom-1 self-center text-[10px] py-0.5 px-1 rounded-sm bg-blue-600 dark:bg-[#0E00D0] text-white">16</div>
          </div>
          <div className="flex-1 min-w-0">
            <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">{session?.user?.name || "Usuário"}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
              <Mail className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate">{session?.user?.email || ""}</span>
            </span>
          </div>
        </div>

        {/* Menu mobile */}
        <div className="space-y-1 cursor-pointer">
          <button
            onClick={handleThemeToggle}
            className="flex cursor-pointer items-center justify-between w-full p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#1F293C] transition-all duration-200"
          >
            <div className="cursor-pointer flex items-center space-x-3">{themeIcon}<span>{themeLabel}</span></div>
            <div role="switch" aria-checked={isDark} className={`relative inline-flex h-[18px] w-[34px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isDark ? 'bg-blue-600' : 'bg-gray-400'}`}>
              <span className={`pointer-events-none block h-[14px] w-[14px] rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${isDark ? 'translate-x-[16px]' : 'translate-x-0'}`} />
            </div>
          </button>

          <a
            href="/perfil"
            className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#1F293C] hover:border hover:border-blue-500 dark:hover:border-[#0E00D0] transition-all duration-200"
          >
            <User className="w-5 h-5" />
            <span>Meu Perfil</span>
          </a>

          <div className="border-t border-gray-300 dark:border-[#555555] pt-2">
            <button
              onClick={() => signOut()}
              className="flex items-center justify-between w-full p-3 rounded-lg text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-[#2A1A2A] transition-all duration-200"
            >
              <div className="flex items-center space-x-3"><LogOut className="w-5 h-5" /><span>Sair</span></div>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const active = pathname.startsWith('/perfil');

  // === JSX DESKTOP ===
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gray-100 dark:bg-[#1F293C] hover:bg-gray-200 dark:hover:bg-[#2A374B] focus:outline-none transition-all duration-300 border border-gray-300 dark:border-[#555555] hover:border-blue-500 dark:hover:border-[#0E00D0] hover:shadow-lg hover:shadow-blue-500/20 group"
      >
        <div className="relative w-full h-full">
          {image ? (
            <img
              src={image}
              alt={session?.user.name}
              className={`w-full h-full transition-all duration-300 rounded-full object-cover
          ${active ? "ring-2 ring-blue-600 dark:ring-[#0E00D0]" : "ring-0"}`
              }
              referrerPolicy="no-referrer"
            />
          ) : (
            <CircleUserRound
              className={`w-full h-full transition-colors duration-300
          ${active
                  ? "text-blue-600 dark:text-[#0E00D0]"
                  : "text-gray-700 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#0E00D0]"
                }`}
            />
          )}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 dark:bg-[#0E00D0] rounded-full border-2 border-gray-100 dark:border-[#1F293C]"></div>
        </div>
      </button>


      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#00091A] text-gray-900 dark:text-white border border-gray-300 dark:border-[#555555] shadow-2xl rounded-lg overflow-hidden z-50">
          <div className="p-4 bg-gray-100 dark:bg-[#1F293C] border-b border-gray-300 dark:border-[#555555] flex items-center gap-3">
            <div className="relative flex flex-col">
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 dark:border-[#0E00D0] w-12 h-12">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-full h-full rounded-full bg-blue-600 dark:bg-[#0E00D0] flex items-center justify-center font-semibold text-white text-sm">
                    {session?.user?.name ? getInitials(session.user.name) : <User className="w-5 h-5" />}
                  </span>
                )}
              </span>
              <div className="absolute -bottom-1 self-center text-[10px] py-0.5 px-1 rounded-sm bg-blue-600 dark:bg-[#0E00D0] text-white">16</div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">{session?.user?.name || "Usuário"}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                <Mail className="w-3 h-3 mr-1 shrink-0" />
                <span className="truncate">{session?.user?.email || ""}</span>
              </span>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={handleThemeToggle}
              className="flex cursor-pointer items-center justify-between w-full px-3 py-2.5 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1F293C] transition-all duration-200 mb-1"
            >
              <div className="flex cursor-pointer items-center space-x-3">{themeIcon}<span>{themeLabel}</span></div>
              <div role="switch" aria-checked={isDark} className={`relative inline-flex h-[18px] w-[34px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isDark ? 'bg-blue-600' : 'bg-gray-400'}`}>
                <span className={`pointer-events-none block h-[14px] w-[14px] rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${isDark ? 'translate-x-[16px]' : 'translate-x-0'}`} />
              </div>
            </button>

            <a
              href="/perfil"
              className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1F293C] hover:border hover:border-blue-500 dark:hover:border-[#0E00D0] transition-all duration-200 mb-1"
            >
              <User className="w-4 h-4" />
              <span>Meu Perfil</span>
            </a>

            <div className="bg-gray-300 dark:bg-[#555555] h-px my-1"></div>

            <button
              onClick={() => signOut()}
              className="flex items-center cursor-pointer justify-between w-full px-3 py-2.5 text-sm rounded-md text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-[#2A1A2A] transition-all duration-200"
            >
              <div className="flex items-center space-x-3"><LogOut className="w-4 h-4" /><span>Sair da conta</span></div>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

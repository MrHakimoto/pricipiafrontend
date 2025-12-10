"use client"

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, Film, NotepadText, MessageSquare, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useProgressBar } from '../Context/ProgressBarContext';
import { useRouter } from 'next/navigation';
import { UserMenu } from '../UserComponente';
import { NotificationsMenu } from '../NotificationsMenu';
import { useSession } from "next-auth/react";

export const NavBarComponent = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { start } = useProgressBar();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session, status, update } = useSession();
    const sessionAny = session as any;
    
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        document.body.style.position = isMobileMenuOpen ? 'fixed' : '';
        document.body.style.width = isMobileMenuOpen ? '100%' : '';
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isMobileMenuOpen]);

    const handleNavigate = (href: string) => {
        if (href !== pathname) {
            start();
            router.push(href);
            setIsMobileMenuOpen(false);
        }
    };

    const navItems = [
        { href: '/home', label: 'Início', icon: Home },
        { href: '/conteudo', label: 'Conteúdo', icon: Film, isActive: (path: string) => path.includes('/conteudo') || path.includes('/modulos') },
        { href: '/exercicios', label: 'Exercícios', icon: NotepadText },
        { href: '/forum', label: 'Fórum', icon: MessageSquare },
    ];

    return (
        <>
            {/* Navbar Principal - Reduzida */}
            <nav className="flex items-center justify-between bg-[#F8F8F8] dark:bg-[#00091A] px-4 lg:px-6 py-1 shadow-md border-b border-[#555555]">

                {/* Logo e Botão Mobile - Reduzidos */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden cursor-pointer w-10 h-10 rounded-full bg-[#1F293C] flex items-center justify-center text-[#DBD9D9] hover:bg-[#2A374B] hover:border hover:border-[#0E00D0] hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <Link href={'/home'} className="flex-shrink-0">
                        {/* Logo Light - Reduzida */}
                        <img
                            src="/logo-principia-black.png"
                            alt="Princípia Matemática"
                            className="w-28 lg:w-[180px] h-14 lg:h-[90px] object-contain block dark:hidden"
                        />

                        {/* Logo Dark - Reduzida */}
                        <img
                            src="/logo-principia-white.png"
                            alt="Princípia Matemática"
                            className="w-28 lg:w-[180px] h-14 lg:h-[90px] object-contain hidden dark:block"
                        />
                    </Link>
                </div>

                {/* Menu Desktop - Reduzido */}
                <div className="hidden lg:flex items-center space-x-6">
                    {navItems.map(({ href, label, icon: Icon, isActive }) => {
                        const active = isActive ? isActive(pathname) : pathname.includes(href);
                        return (
                            <button
                                key={href}
                                onClick={() => handleNavigate(href)}
                                className={`flex items-center cursor-pointer space-x-2 text-xl group relative transition-all duration-300 ${active ? 'font-bold text-black dark:text-white' : 'text-[#4A5260] hover:text-black dark:hover:text-white'
                                    }`}
                            >
                                <Icon
                                    className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-[#0E00D0]' : 'text-[#4A5260] group-hover:text-[#0E00D0]'
                                        }`}
                                />
                                <span className="relative">
                                    {label}
                                    {/* Linha azul de hover */}
                                    {!active && (
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0E00D0] transition-all duration-300 group-hover:w-full" />
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Ícones Laterais */}
                <div className="flex items-center space-x-3">
                    <NotificationsMenu hoverColor="#0E00D0" />
                    <div className="cursor-pointer hidden lg:block">
                        <UserMenu session={sessionAny} hoverColor="#0E00D0" />
                    </div>
                </div>
            </nav>

            {/* Menu Mobile */}
            <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />

                <div className={`absolute right-0 top-0 h-full w-72 bg-[#00091A] border-l border-[#555555] shadow-2xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex items-center justify-between p-4 border-b border-[#555555]">
                        <h2 className="text-lg font-bold text-white">Menu</h2>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-9 h-9 rounded-full bg-[#1F293C] flex items-center justify-center text-[#DBD9D9] hover:bg-[#2A374B] hover:text-white transition-all duration-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-full overflow-y-auto p-4 space-y-4">
                        <div className="space-y-2">
                            {navItems.map(({ href, label, icon: Icon, isActive }) => {
                                const active = isActive ? isActive(pathname) : pathname.includes(href);
                                return (
                                    <button
                                        key={href}
                                        onClick={() => handleNavigate(href)}
                                        className={`flex items-center w-full cursor-pointer space-x-3 text-lg p-3 rounded-xl transition-all duration-300 group ${active ? 'bg-[#1F293C] border border-[#0E00D0] text-white font-bold' : 'text-[#4A5260] hover:text-[#0E00D0] hover:bg-[#1A2332]'
                                            }`}
                                    >
                                        <Icon
                                            className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-[#0E00D0]' : 'text-[#4A5260] group-hover:text-[#0E00D0]'
                                                }`}
                                        />
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="pt-4 border-t border-[#555555]">
                            <UserMenu mobile session={sessionAny} hoverColor="#0E00D0" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
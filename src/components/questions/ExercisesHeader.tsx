"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
    // { href: '/exercicios', label: 'Todas Questões' },
    { href: '/exercicios/listas-oficiais', label: 'Listas Oficiais' },
    // { href: '/exercicios/provas-famosas', label: 'Provas Famosas' },
    // { href: '/exercicios/minhas-listas', label: 'Minhas Listas' },
];

export function ExercisesHeader() {
    const pathname = usePathname();

    return (
        <div className="bg-[#D7D7D7] text-black dark:bg-[#1B1F27] dark:text-white  px-8 pt-8">
            <div className="flex items-center">
                <h1 className="text-3xl font-bold text-black dark:text-white">Exercícios</h1>
                <span className="text-3xl font-bold text-black dark:text-white mx-2">|</span>
                <p className="text-black dark:text-white text-xl">
                    Explore as listas e questões disponíveis no nosso banco.
                </p>
            </div>

            <div className="mt-6 flex space-x-6">
                {tabs.map((tab) => {
                    const isActive =
                        pathname === tab.href ||
                        (tab.href === '/exercicios' && pathname.startsWith('/exercicios/s/'));

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`text-xl px-3 pb-2 transition-all duration-200
                                ${isActive
                                    ? 'text-white border-b-2 border-pink-600'
                                    : 'text-gray-400 hover:text-white hover:border-b-2 hover:border-pink-600'
                                }`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

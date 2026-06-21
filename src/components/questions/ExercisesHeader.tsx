"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/exercicios",
    label: "Todas Questões",
    match: (pathname: string) =>
      pathname === "/exercicios" || pathname.startsWith("/exercicios/s/"),
  },
  {
    href: "/exercicios/listas-oficiais",
    label: "Listas Oficiais",
    match: (pathname: string) =>
      pathname.startsWith("/exercicios/listas-oficiais"),
  },
  {
    href: "/exercicios/provas-famosas",
    label: "Provas Famosas",
    match: (pathname: string) =>
      pathname.startsWith("/exercicios/provas-famosas"),
  },
  {
    href: "/exercicios/minhas-listas",
    label: "Minhas Listas",
    match: (pathname: string) =>
      pathname.startsWith("/exercicios/minhas-listas"),
  },
];

export function ExercisesHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/10 bg-[#D7D7D7] px-4 pt-5 text-black dark:border-white/10 dark:bg-[#151A23] dark:text-white sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white sm:text-3xl">
              Exercícios
            </h1>

            <span className="hidden h-7 w-px bg-black/30 dark:bg-white/25 sm:block" />
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:pb-1 sm:text-base lg:text-lg">
            Explore as listas e questões disponíveis no nosso banco.
          </p>
        </div>

        <nav
          aria-label="Navegação de exercícios"
          className="mt-5 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:mt-6 lg:px-8"
        >
          <div className="flex min-w-max items-center gap-2 sm:gap-4">
            {tabs.map((tab) => {
              const isActive = tab.match(pathname);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "relative rounded-t-md px-3 pb-3 pt-2 text-sm font-medium transition-colors sm:text-base",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E60076] focus-visible:ring-offset-2 focus-visible:ring-offset-[#D7D7D7] dark:focus-visible:ring-offset-[#151A23]",
                    isActive
                      ? "text-black dark:text-white"
                      : "text-zinc-500 hover:text-black dark:text-zinc-500 dark:hover:text-white",
                  ].join(" ")}
                >
                  {tab.label}

                  <span
                    className={[
                      "absolute bottom-0 left-3 right-3 h-0.5 rounded-full transition-all duration-200",
                      isActive
                        ? "bg-[#E60076] opacity-100"
                        : "bg-[#E60076] opacity-0 group-hover:opacity-100",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
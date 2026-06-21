// app/role-badge-preview/page.tsx

import { GraduationCap, ShieldCheck, User, Wrench, Crown } from "lucide-react";
import clsx from "clsx";

type Role = {
  slug: string;
  display_name?: string | null;
  name?: string;
};

interface RoleBadgeProps {
  role?: Role | null;
  className?: string;
}

const roleConfig = {
  admin: {
    label: "Administrador",
    icon: Crown,
    className:
      "border-red-400/40 bg-red-950/30 text-red-200 shadow-[0_0_14px_rgba(248,113,113,0.35)]",
  },
  professor: {
    label: "Professor",
    icon: GraduationCap,
    className:
      "professor-role-badge border-cyan-300/40 bg-cyan-950/30 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.35)]",
  },
  curador: {
    label: "Curador",
    icon: ShieldCheck,
    className:
      "border-purple-400/40 bg-purple-950/30 text-purple-200 shadow-[0_0_12px_rgba(192,132,252,0.25)]",
  },
  moderador: {
    label: "Moderador",
    icon: Wrench,
    className:
      "border-amber-400/40 bg-amber-950/30 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.25)]",
  },
  monitor: {
    label: "Monitor",
    icon: ShieldCheck,
    className:
      "border-emerald-400/40 bg-emerald-950/30 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)]",
  },
  aluno: {
    label: "Aluno",
    icon: User,
    className: "border-slate-500/40 bg-slate-900/40 text-slate-300",
  },
} as const;

function RoleBadge({ role, className }: RoleBadgeProps) {
  const slug = role?.slug ?? "aluno";
  const config = roleConfig[slug as keyof typeof roleConfig] ?? roleConfig.aluno;

  const Icon = config.icon;
  const label = role?.display_name || role?.name || config.label;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        "select-none whitespace-nowrap transition-all duration-300",
        config.className,
        className
      )}
    >
      <Icon className="relative z-10 h-3.5 w-3.5" />

      {slug === "professor" ? (
        <span className="professor-role-text">{label}</span>
      ) : (
        <span className="relative z-10">{label}</span>
      )}
    </span>
  );
}

const roles: Role[] = [
  { slug: "admin", display_name: "Administrador" },
  { slug: "professor", display_name: "Professor" },
  { slug: "curador", display_name: "Curador" },
  { slug: "moderador", display_name: "Moderador" },
  { slug: "monitor", display_name: "Monitor" },
  { slug: "aluno", display_name: "Aluno" },
];

const users = [
  {
    name: "Filipe Ozanam",
    role: { slug: "admin", display_name: "Administrador" },
    points: "12.840",
    description: "Controle total da plataforma.",
  },
  {
    name: "Prof. Milton",
    role: { slug: "professor", display_name: "Professor" },
    points: "9.310",
    description: "Badge animada, luminosa e distintiva.",
  },
  {
    name: "Maria Curadora",
    role: { slug: "curador", display_name: "Curador" },
    points: "7.600",
    description: "Validação e curadoria de questões.",
  },
  {
    name: "Lucas Moderador",
    role: { slug: "moderador", display_name: "Moderador" },
    points: "6.420",
    description: "Ordem, zelo e manutenção comunitária.",
  },
  {
    name: "Ana Monitora",
    role: { slug: "monitor", display_name: "Monitor" },
    points: "3.180",
    description: "Apoio aos alunos e acompanhamento.",
  },
  {
    name: "Pedro Aluno",
    role: { slug: "aluno", display_name: "Aluno" },
    points: "940",
    description: "Usuário comum da plataforma.",
  },
];

export default function RoleBadgePreviewPage() {
  return (
    <main className="min-h-screen bg-[#00091A] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">
            Principia Matemática
          </p>

          <h1 className="text-3xl font-black tracking-tight">
            Prévia estática das badges de cargo
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Página de inspeção visual para verificar contraste, brilho,
            animação do cargo de Professor e harmonia geral dos cargos em cards,
            tabela e listagem simples.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-[#020D24] p-6 shadow-2xl shadow-black/20">
          <h2 className="mb-5 text-lg font-bold">Badges isoladas</h2>

          <div className="flex flex-wrap gap-3">
            {roles.map((role) => (
              <RoleBadge key={role.slug} role={role} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[#020D24] p-6 shadow-2xl shadow-black/20">
          <h2 className="mb-5 text-lg font-bold">Variações de tamanho</h2>

          <div className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Pequena
              </p>

              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <RoleBadge
                    key={role.slug}
                    role={role}
                    className="px-2 py-0.5 text-[10px]"
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Normal
              </p>

              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <RoleBadge key={role.slug} role={role} />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Grande
              </p>

              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <RoleBadge
                    key={role.slug}
                    role={role}
                    className="px-4 py-1.5 text-sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[#020D24] p-6 shadow-2xl shadow-black/20">
          <h2 className="mb-5 text-lg font-bold">Cards de usuários</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <article
                key={user.name}
                className="rounded-2xl border border-slate-800 bg-[#00091A] p-5 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-xl hover:shadow-black/30"
              >
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-base font-black text-slate-200">
                    {user.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-100">
                      {user.name}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {user.points} pontos
                    </p>
                  </div>
                </div>

                <p className="mb-4 min-h-[40px] text-sm leading-5 text-slate-400">
                  {user.description}
                </p>

                <RoleBadge role={user.role} />
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[#020D24] p-6 shadow-2xl shadow-black/20">
          <h2 className="mb-5 text-lg font-bold">Tabela</h2>

          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Pontos</th>
                  <th className="px-4 py-3">Observação</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800 bg-[#00091A]">
                {users.map((user) => (
                  <tr key={user.name}>
                    <td className="px-4 py-4 font-semibold text-slate-200">
                      {user.name}
                    </td>

                    <td className="px-4 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {user.points}
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {user.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
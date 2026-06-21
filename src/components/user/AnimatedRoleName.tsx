import styles from "./AnimatedRoleName.module.css";

export type UserRole = {
  id?: number;
  name?: string | null;
  slug?: string | null;
  display_name?: string | null;
  description?: string | null;
  priority?: number | null;
  is_staff?: boolean | number | null;
};

interface AnimatedRoleNameProps {
  name?: string | null;
  roles?: UserRole[] | null;
  role?: UserRole | null;
  level?: number | null;
  levelTitle?: string | null;
  className?: string;
  nameClassName?: string;
  tooltipClassName?: string;
  fallbackName?: string;
  showTooltip?: boolean;
  showLevel?: boolean;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPrimaryRole(roles?: UserRole[] | null, role?: UserRole | null) {
  if (role) return role;

  if (!Array.isArray(roles) || roles.length === 0) return null;

  return [...roles].sort(
    (a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0),
  )[0];
}

function getRoleDisplayName(role?: UserRole | null) {
  return role?.display_name || role?.name || "Aluno";
}

function getRoleDescription(role?: UserRole | null) {
  if (role?.description) return role.description;

  switch (role?.slug) {
    case "admin":
      return "Responsável pela administração geral da plataforma.";
    case "professor":
      return "Autoridade pedagógica da plataforma.";
    case "curador":
      return "Responsável pela curadoria, revisão e organização dos conteúdos.";
    case "moderador":
      return "Responsável pela ordem e civilidade da comunidade.";
    case "monitor":
      return "Auxilia alunos e professores na comunidade.";
    case "aluno":
      return "Usuário estudante da plataforma.";
    default:
      return "Membro da comunidade Principia.";
  }
}

function getRoleClass(role?: UserRole | null) {
  switch (role?.slug) {
    case "admin":
      return styles.adminName;
    case "professor":
      return styles.professorName;
    case "curador":
      return styles.curadorName;
    case "moderador":
      return styles.moderadorName;
    case "monitor":
      return styles.monitorName;
    case "aluno":
      return styles.alunoName;
    default:
      return styles.defaultName;
  }
}

export function AnimatedRoleName({
  name,
  roles,
  role,
  level,
  levelTitle,
  className,
  nameClassName,
  tooltipClassName,
  fallbackName = "Usuário",
  showTooltip = true,
  showLevel = true,
}: AnimatedRoleNameProps) {
  const primaryRole = getPrimaryRole(roles, role);

  const visibleName = name?.trim() || fallbackName;
  const roleName = getRoleDisplayName(primaryRole);
  const roleDescription = getRoleDescription(primaryRole);

  const normalizedLevel =
    typeof level === "number" && Number.isFinite(level) && level > 0
      ? level
      : null;

  return (
    <span className={joinClasses(styles.wrapper, className)}>
      <span
        tabIndex={showTooltip ? 0 : undefined}
        className={joinClasses(styles.nameLine, nameClassName)}
      >
        <span
          className={joinClasses(
            styles.animatedName,
            getRoleClass(primaryRole),
          )}
          title={visibleName}
        >
          {visibleName}
        </span>

        {showLevel && normalizedLevel ? (
          <span
            className={styles.levelBadge}
            aria-label={`Nível ${normalizedLevel}`}
          >
            N{normalizedLevel}
          </span>
        ) : null}
      </span>

      {showTooltip ? (
        <span
          role="tooltip"
          className={joinClasses(styles.tooltip, tooltipClassName)}
        >
          <span className={styles.tooltipTitle}>{roleName}</span>

          <span className={styles.tooltipDescription}>{roleDescription}</span>

          {normalizedLevel ? (
            <span className={styles.tooltipLevel}>
              Nível {normalizedLevel}
              {levelTitle ? ` — ${levelTitle}` : ""}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
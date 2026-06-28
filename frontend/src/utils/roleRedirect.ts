import type { UserRole } from "../types/auth";

const roleLabels: Record<UserRole, string> = {
  CLIENT: "Cliente",
  PROFESSIONAL: "Barbeiro",
  ADMIN: "Administrador",
};

export function getRoleLabel(role: UserRole) {
  return roleLabels[role];
}

export function getRoleRedirectPath(role: UserRole) {
  const paths: Record<UserRole, string> = {
    CLIENT: "/cliente",
    PROFESSIONAL: "/colaborador",
    ADMIN: "/admin",
  };

  return paths[role];
}

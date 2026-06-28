import {
  CalendarDays,
  CreditCard,
  Gift,
  Home,
  Scissors,
  Shield,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "../../types/auth";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: UserRole[];
};

export const privateNavItems: NavItem[] = [
  {
    href: "/cliente",
    icon: Home,
    label: "Inicio",
    roles: ["CLIENT"],
  },
  {
    href: "/cliente#agendamento",
    icon: CalendarDays,
    label: "Agendar",
    roles: ["CLIENT"],
  },
  {
    href: "/planos",
    icon: CreditCard,
    label: "Planos",
    roles: ["CLIENT"],
  },
  {
    href: "/loja",
    icon: ShoppingBag,
    label: "Loja",
    roles: ["CLIENT"],
  },
  {
    href: "/premios",
    icon: Gift,
    label: "Premios",
    roles: ["CLIENT"],
  },
  {
    href: "/perfil",
    icon: UserRound,
    label: "Perfil",
    roles: ["CLIENT"],
  },
  {
    href: "/colaborador",
    icon: Scissors,
    label: "Colaborador",
    roles: ["PROFESSIONAL"],
  },
  {
    href: "/admin",
    icon: Shield,
    label: "Painel",
    roles: ["ADMIN"],
  },
];

export function getNavItemsForRole(role: UserRole) {
  return privateNavItems.filter((item) => item.roles.includes(role));
}

export function isNavItemActive(
  item: NavItem,
  location: { hash: string; pathname: string },
) {
  const [itemPath, itemHash = ""] = item.href.split("#");

  if (itemHash) {
    return location.pathname === itemPath && location.hash === `#${itemHash}`;
  }

  if (itemPath === "/cliente") {
    return location.pathname === itemPath && location.hash !== "#agendamento";
  }

  return (
    location.pathname === itemPath ||
    location.pathname.startsWith(`${itemPath}/`)
  );
}

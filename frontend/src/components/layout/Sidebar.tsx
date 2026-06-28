import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import type { UserRole } from "../../types/auth";
import { getNavItemsForRole, isNavItemActive } from "./navigation";

type SidebarProps = {
  role: UserRole;
};

export function Sidebar({ role }: SidebarProps) {
  const items = getNavItemsForRole(role);
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-club-black/95 px-5 py-6 lg:block">
      <div className="flex items-center gap-3">
        <img alt="Club do Rafa" className="size-11 rounded-lg border border-white/10 bg-club-surface" src="/logo-icon.svg" />
        <div>
          <p className="font-display text-2xl font-semibold uppercase leading-none text-white">
            Club do Rafa
          </p>
          <p className="mt-1 text-xs font-medium uppercase text-zinc-500">
            Sistema
          </p>
        </div>
      </div>

      <nav className="mt-9 space-y-2">
        {items.map((item) => (
          <Link
            className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white",
              isNavItemActive(item, location) &&
                "bg-club-red text-white hover:bg-club-red",
            )}
            key={`${item.href}-${item.label}`}
            to={item.href}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

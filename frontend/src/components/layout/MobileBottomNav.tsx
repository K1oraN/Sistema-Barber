import { Link, useLocation } from "react-router-dom";
import type { UserRole } from "../../types/auth";
import { cn } from "../../utils/cn";
import { getNavItemsForRole, isNavItemActive } from "./navigation";

type MobileBottomNavProps = {
  role: UserRole;
};

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const items = getNavItemsForRole(role).slice(0, 4);
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-club-black/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <div
        className="mx-auto grid max-w-md gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <Link
            className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.68rem] font-bold uppercase leading-tight text-zinc-500 transition hover:bg-white/5 hover:text-white",
              isNavItemActive(item, location) && "bg-club-red/15 text-white",
            )}
            key={`${item.href}-${item.label}`}
            to={item.href}
          >
            <item.icon className="size-5" aria-hidden="true" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

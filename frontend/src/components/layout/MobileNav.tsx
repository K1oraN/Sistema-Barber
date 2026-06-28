import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import type { UserRole } from "../../types/auth";
import { getNavItemsForRole, isNavItemActive } from "./navigation";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
};

export function MobileNav({ isOpen, onClose, role }: MobileNavProps) {
  const items = getNavItemsForRole(role);
  const location = useLocation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden">
      <div className="h-full w-full max-w-sm border-r border-white/10 bg-club-black p-5 shadow-premium">
        <div className="flex items-center justify-between gap-4">
          <img alt="Club do Rafa" className="h-11 w-auto" src="/logo.svg" />
          <Button aria-label="Fechar menu" onClick={onClose} size="sm" type="button" variant="ghost">
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <nav className="mt-8 space-y-2">
          {items.map((item) => (
            <Link
              className={cn(
                  "flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white",
                isNavItemActive(item, location) && "bg-club-red text-white",
              )}
              key={`${item.href}-${item.label}`}
              onClick={onClose}
              to={item.href}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

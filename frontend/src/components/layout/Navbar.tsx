import { LogOut, Menu, UserRound } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { User } from "../../types/auth";
import { getRoleLabel } from "../../utils/roleRedirect";

type NavbarProps = {
  onLogout: () => void;
  onMenu?: () => void;
  user: User;
};

export function Navbar({ onLogout, onMenu, user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-club-black/80 backdrop-blur">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-4 sm:h-20 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            aria-label="Abrir menu"
            className="lg:hidden"
            onClick={onMenu}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-500">Bem-vindo</p>
            <p className="mt-1 max-w-[11rem] truncate font-display text-xl font-semibold uppercase text-white sm:max-w-none sm:text-2xl">
              {user.name}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Badge className="hidden sm:inline-flex" tone="red">{getRoleLabel(user.role)}</Badge>
          <div className="hidden items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 sm:flex">
            <UserRound className="size-4 text-club-red" aria-hidden="true" />
            <span className="max-w-[12rem] truncate text-sm font-semibold text-zinc-300">
              {user.name?.trim() || user.email}
            </span>
          </div>
          <Button aria-label="Sair" onClick={onLogout} size="sm" type="button" variant="ghost">
            <LogOut className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}

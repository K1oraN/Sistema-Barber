import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "../ui/Button";

const menuItems = [
  { href: "/#inicio", label: "Início" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/#galeria", label: "Galeria" },
  { href: "/#equipe", label: "Equipe" },
  { href: "/#contato", label: "Contato" },
];

export function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen bg-club-black text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-club-black/82 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <a className="flex items-center gap-3" href="/#inicio">
            <div className="flex size-11 items-center justify-center rounded-lg border border-white/10 bg-club-surface">
              <img alt="Club do Rafa" className="size-7" src="/logo-icon.svg" />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold uppercase leading-none tracking-normal text-white">
                CLUB DO <span className="text-club-red">RAFA</span>
              </p>
              <p className="mt-1 text-xs font-medium uppercase text-zinc-500">
                Barbearia premium
              </p>
            </div>
          </a>

          {isLanding ? (
            <nav className="hidden items-center gap-1 lg:flex">
              {menuItems.map((item) => (
                <a
                  className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          ) : (
            <nav className="hidden items-center gap-1 lg:flex">
              <Link
                className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white"
                to="/"
              >
                Início
              </Link>
              <Link
                className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white"
                to="/termos"
              >
                Termos
              </Link>
            </nav>
          )}

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login">
              <Button type="button" variant="secondary">
                Entrar
              </Button>
            </Link>
          </div>

          {isLanding ? (
            <button
              aria-label="Abrir menu"
              className="inline-flex size-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
              onClick={() => setIsMenuOpen(true)}
              type="button"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          ) : (
            <Link className="lg:hidden" to="/login">
              <Button size="sm" type="button" variant="secondary">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </header>

      {isLanding && isMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm lg:hidden">
          <div className="ml-auto h-full w-full max-w-sm border-l border-white/10 bg-club-black p-5 shadow-premium">
            <div className="flex items-center justify-between gap-4">
              <p className="font-display text-2xl font-semibold uppercase text-white">
                Menu
              </p>
              <button
                aria-label="Fechar menu"
                className="inline-flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                onClick={() => setIsMenuOpen(false)}
                type="button"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="mt-8 grid gap-2">
              {menuItems.map((item) => (
                <a
                  className="flex min-h-12 items-center rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-club-red/50 hover:bg-white/5 hover:text-white"
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link onClick={() => setIsMenuOpen(false)} to="/login">
                <Button className="mt-3 w-full" type="button">
                  Entrar
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      ) : null}

      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
}

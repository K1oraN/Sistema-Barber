import type { ReactNode } from "react";

const authImage =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1600&q=85";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthShell({ children, description, eyebrow, title }: AuthShellProps) {
  return (
    <section className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top_right,rgba(217,4,41,0.14),transparent_26rem)]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-stretch px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-10">
        <div className="relative hidden overflow-hidden rounded-lg border border-white/10 bg-club-surface shadow-premium lg:block">
          <img
            alt="Barbearia Club do Rafa"
            className="absolute inset-0 h-full w-full object-cover"
            src={authImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/72 to-black/25" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg border border-white/10 bg-black/45 backdrop-blur">
                <img alt="Club do Rafa" className="size-8" src="/logo-icon.svg" />
              </div>
              <p className="font-display text-3xl font-semibold uppercase text-white">
                CLUB DO <span className="text-club-red">RAFA</span>
              </p>
            </div>

            <div className="max-w-xl animate-slide-up">
              <span className="inline-flex rounded-md border border-club-red/30 bg-club-red/10 px-4 py-2 text-xs font-bold uppercase text-red-100">
                {eyebrow}
              </span>
              <h2 className="mt-5 font-display text-5xl font-semibold uppercase leading-tight text-white">
                Estilo começa antes do espelho.
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                Agenda, pontos e benefícios em uma experiência digital com a
                mesma presença da cadeira.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-[30rem] animate-fade-in rounded-lg border border-white/10 bg-club-surface p-5 shadow-premium sm:p-7">
            <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-zinc-400 lg:hidden">
              {eyebrow}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold uppercase leading-tight text-white sm:text-5xl lg:mt-0">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {description}
            </p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-zinc-400">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-3 font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-3">{actions}</div> : null}
    </div>
  );
}


import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

type StatCardProps = {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
};

export function StatCard({ className, detail, icon: Icon, label, value }: StatCardProps) {
  return (
    <article
      className={cn(
        "rounded-lg border border-white/10 bg-club-surface p-5 shadow-premium transition duration-200 hover:-translate-y-1 hover:border-white/20",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-zinc-400">{label}</span>
        <span className="flex size-10 items-center justify-center rounded-md bg-club-red/10 text-club-red">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <strong className="mt-5 block font-display text-4xl font-semibold text-white">
        {value}
      </strong>
      <p className="mt-2 text-sm text-zinc-500">{detail}</p>
    </article>
  );
}


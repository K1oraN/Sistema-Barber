import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

type LoadingProps = {
  label?: string;
  className?: string;
};

export function Loading({ className, label = "Carregando" }: LoadingProps) {
  return (
    <div className={cn("flex min-h-64 items-center justify-center", className)}>
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-club-surface px-5 py-4 text-sm font-semibold text-zinc-300">
        <Loader2 className="size-5 animate-spin text-club-red" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}


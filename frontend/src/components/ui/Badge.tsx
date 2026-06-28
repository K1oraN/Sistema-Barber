import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "red" | "green" | "zinc" | "amber" | "blue";
};

export function Badge({ className, tone = "zinc", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md border px-3 text-xs font-bold uppercase",
        tone === "red" && "border-club-red/30 bg-club-red/10 text-red-100",
        tone === "green" && "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
        tone === "amber" && "border-amber-400/30 bg-amber-400/10 text-amber-100",
        tone === "blue" && "border-sky-400/30 bg-sky-400/10 text-sky-100",
        tone === "zinc" && "border-white/10 bg-white/5 text-zinc-300",
        className,
      )}
      {...props}
    />
  );
}

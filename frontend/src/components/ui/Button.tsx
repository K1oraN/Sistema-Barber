import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  className,
  children,
  disabled,
  isLoading = false,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold transition duration-200 focus:outline-none focus:ring-2 focus:ring-club-red/40 disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "min-h-9 px-3",
        size === "md" && "min-h-11 px-5",
        size === "lg" && "min-h-12 px-6",
        variant === "primary" &&
          "bg-club-red text-white hover:bg-red-700 hover:shadow-lg hover:shadow-club-red/15",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-zinc-100 hover:border-white/20 hover:bg-white/10",
        variant === "ghost" &&
          "text-zinc-300 hover:bg-white/5 hover:text-white",
        variant === "danger" &&
          "border border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20",
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

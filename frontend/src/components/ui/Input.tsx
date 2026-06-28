import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  success?: boolean;
};

export function Input({ className, error, id, label, success = false, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block" htmlFor={inputId}>
      {label ? (
        <span className="text-sm font-semibold text-zinc-300">{label}</span>
      ) : null}
      <input
        className={cn(
          "mt-2 h-12 w-full rounded-md border border-white/10 bg-club-black px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-club-red disabled:cursor-not-allowed disabled:opacity-60",
          error && "border-club-red",
          success && !error && "border-emerald-500/70 focus:border-emerald-400",
          className,
        )}
        id={inputId}
        {...props}
      />
      {error ? (
        <span className="mt-2 block text-xs font-semibold text-club-red">
          {error}
        </span>
      ) : null}
    </label>
  );
}

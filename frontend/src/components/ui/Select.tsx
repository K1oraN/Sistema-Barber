import type { SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ children, className, error, id, label, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="block" htmlFor={selectId}>
      {label ? (
        <span className="text-sm font-semibold text-zinc-300">{label}</span>
      ) : null}
      <select
        className={cn(
          "mt-2 h-12 w-full rounded-md border border-white/10 bg-club-black px-4 text-sm text-white outline-none transition focus:border-club-red disabled:cursor-not-allowed disabled:opacity-60",
          error && "border-club-red",
          className,
        )}
        id={selectId}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span className="mt-2 block text-xs font-semibold text-club-red">
          {error}
        </span>
      ) : null}
    </label>
  );
}


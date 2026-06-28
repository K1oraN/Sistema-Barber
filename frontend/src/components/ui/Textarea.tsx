import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ className, error, id, label, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <label className="block" htmlFor={textareaId}>
      {label ? (
        <span className="text-sm font-semibold text-zinc-300">{label}</span>
      ) : null}
      <textarea
        className={cn(
          "mt-2 min-h-32 w-full resize-y rounded-md border border-white/10 bg-club-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-club-red disabled:cursor-not-allowed disabled:opacity-60",
          error && "border-club-red",
          className,
        )}
        id={textareaId}
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


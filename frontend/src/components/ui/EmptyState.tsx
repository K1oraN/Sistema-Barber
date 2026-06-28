import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "./Button";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  actionLabel,
  description,
  icon: Icon = Inbox,
  onAction,
  title,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-white/10 bg-club-black text-club-red">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold uppercase text-white">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction} type="button">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}


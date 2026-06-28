import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  isOpen: boolean;
  maxWidthClassName?: string;
  onClose: () => void;
  title: string;
};

export function Modal({
  children,
  description,
  footer,
  isOpen,
  maxWidthClassName = "max-w-lg",
  onClose,
  title,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        aria-modal="true"
        className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100vw-2rem)] ${maxWidthClassName} animate-slide-up flex-col overflow-hidden rounded-lg border border-white/10 bg-club-surface shadow-premium`}
        role="dialog"
      >
        <div className="shrink-0 border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold uppercase text-white">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            ) : null}
          </div>
          <Button aria-label="Fechar modal" onClick={onClose} size="sm" type="button" variant="ghost">
            <X className="size-5" aria-hidden="true" />
          </Button>
          </div>
        </div>
        <div className="pretty-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-white/10 bg-club-surface p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  confirmLabel?: string;
  description: string;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  confirmLabel = "Confirmar",
  description,
  isLoading = false,
  isOpen,
  onClose,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-club-red/30 bg-club-red/10 text-club-red">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={onClose} type="button" variant="secondary">
          Cancelar
        </Button>
        <Button isLoading={isLoading} onClick={onConfirm} type="button" variant="danger">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}


import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Appointment } from "../../types/domain";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Textarea } from "../ui/Textarea";

type CancelAppointmentModalProps = {
  appointment: Appointment | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

export function CancelAppointmentModal({
  appointment,
  isLoading,
  onClose,
  onConfirm,
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (appointment) {
      setReason("");
    }
  }, [appointment]);

  if (!appointment) {
    return null;
  }

  return (
    <Modal
      description="Informe o motivo, se desejar, e confirme o cancelamento."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Voltar
          </Button>
          <Button
            isLoading={isLoading}
            onClick={() => onConfirm(reason.trim())}
            type="button"
            variant="danger"
          >
            <XCircle className="size-4" aria-hidden="true" />
            Desmarcar
          </Button>
        </div>
      }
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title="Desmarcar agendamento"
    >
      <div className="space-y-4">
        <Textarea
          label="Motivo opcional"
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ex.: Cliente solicitou remarcação"
          value={reason}
        />
      </div>
    </Modal>
  );
}

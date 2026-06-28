import { CheckCircle2, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import type { Appointment, Payment } from "../../types/domain";
import { formatCurrency } from "../../utils/format";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

type PaymentMethod = Payment["method"];

type PaymentConfirmationModalProps = {
  appointment: Appointment | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (data: {
    confirmationNote: string | null;
    method: PaymentMethod;
  }) => Promise<void>;
};

const methodLabels: Record<PaymentMethod, string> = {
  CARD: "Cartão Infinity Pay",
  CASH: "Dinheiro",
  PIX: "Pix",
};

export function PaymentConfirmationModal({
  appointment,
  isLoading,
  onClose,
  onConfirm,
}: PaymentConfirmationModalProps) {
  const [confirmationNote, setConfirmationNote] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("PIX");

  useEffect(() => {
    if (appointment) {
      setConfirmationNote("");
      setMethod(appointment.payment?.method ?? appointment.paymentMethod ?? "PIX");
    }
  }, [appointment]);

  if (!appointment) {
    return null;
  }

  return (
    <Modal
      description="Confirme o método recebido e valide o pagamento."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            isLoading={isLoading}
            onClick={() =>
              onConfirm({
                confirmationNote: confirmationNote.trim() || null,
                method,
              })
            }
            type="button"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Confirmar pagamento
          </Button>
        </div>
      }
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title="Confirmar pagamento"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-white/10 bg-club-black p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-500">
                Valor
              </p>
              <p className="mt-1 font-display text-3xl font-semibold text-white">
                {formatCurrency(appointment.totalValue)}
              </p>
            </div>
            <Badge tone="amber">
              {appointment.payment?.status === "AWAITING_CONFIRMATION"
                ? "Aguardando confirmação"
                : "Pendente"}
            </Badge>
          </div>
        </div>

        <Select
          label="Método"
          onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          value={method}
        >
          {Object.entries(methodLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        {appointment.payment?.receiptUrl ? (
          <div className="rounded-lg border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-100">
            <div className="flex items-center gap-2 font-semibold">
              <FileText className="size-4" aria-hidden="true" />
              Comprovante enviado pelo cliente
            </div>
            <a
              className="mt-2 inline-flex font-bold text-white underline-offset-4 hover:underline"
              href={appointment.payment.receiptUrl}
              rel="noreferrer"
              target="_blank"
            >
              {appointment.payment.receiptFileName ?? "Ver comprovante"}
            </a>
          </div>
        ) : null}

        <Textarea
          label="Observação opcional"
          onChange={(event) => setConfirmationNote(event.target.value)}
          placeholder="Ex.: Pago no balcão"
          value={confirmationNote}
        />

      </div>
    </Modal>
  );
}

import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  QrCode,
  UploadCloud,
} from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { api } from "../services/api";
import type { Appointment, Payment } from "../types/domain";
import { getApiErrorMessage } from "../utils/apiError";
import { cn } from "../utils/cn";
import { formatCurrency, formatDate, formatTime } from "../utils/format";
import { uploadReceipt, validateReceiptFile } from "../utils/receipts";
import { getPaymentStatusTone, paymentStatusLabels } from "../utils/status";

type PaymentMethod = "PIX" | "CARD" | "CASH";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CARD: "Cartão",
  CASH: "Dinheiro",
  PIX: "Pix",
};

const methods: Array<{
  description: string;
  icon: typeof QrCode;
  label: string;
  value: PaymentMethod;
}> = [
  {
    description: "Pix presencialmente ou com comprovante",
    icon: QrCode,
    label: "Pix",
    value: "PIX",
  },
  {
    description: "Pagamentos no cartão são realizados via Infinity Pay",
    icon: CreditCard,
    label: "Cartão",
    value: "CARD",
  },
  {
    description: "Dinheiro presencialmente",
    icon: Banknote,
    label: "Dinheiro",
    value: "CASH",
  },
];

export function PaymentPage() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadAppointment() {
      if (!appointmentId || appointmentId === "demo") {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get<Appointment>(`/appointments/${appointmentId}`);
        setAppointment(data);
        setMethod(data.payment?.method ?? data.paymentMethod ?? "PIX");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    loadAppointment();
  }, [appointmentId]);

  function handleReceiptChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setReceiptFile(null);
      setReceiptFileName("");
      return;
    }

    const validationError = validateReceiptFile(file);

    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      setReceiptFile(null);
      setReceiptFileName("");
      return;
    }

    setReceiptFile(file);
    setReceiptFileName(file.name);
  }

  async function sendReceipt() {
    if (!appointment) {
      return;
    }

    if (!receiptFile) {
      toast.error("Selecione o comprovante antes de enviar.");
      return;
    }

    try {
      setSubmitting(true);
      const { data: payment } = appointment.payment?.id
        ? await api.put<Payment>(`/payments/${appointment.payment.id}`, { method })
        : await api.post<Payment>("/payments", {
            amount: appointment.totalValue,
            appointmentId: appointment.id,
            method,
          });
      const data = await uploadReceipt<Payment>(`/payments/${payment.id}/receipt`, receiptFile);

      setAppointment((current) =>
        current
          ? {
              ...current,
              payment: data,
              paymentMethod: data.method,
            }
          : current,
      );
      setReceiptFile(null);
      setReceiptFileName("");
      toast.success("Comprovante enviado. Aguardando confirmação.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading label="Carregando pagamento" />;
  }

  if (!appointment) {
    return (
      <EmptyState
        description="Selecione um agendamento válido para visualizar o pagamento."
        icon={CreditCard}
        title="Pagamento não encontrado"
      />
    );
  }

  const paymentStatus = appointment.payment?.status ?? "PENDING";
  const isPaid = paymentStatus === "PAID";
  const hasReceipt = Boolean(appointment.payment?.receiptUrl);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate("/cliente")} size="sm" type="button" variant="secondary">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Button>
        <div>
          <h1 className="font-display text-4xl font-semibold uppercase text-white">
            Pagamento
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Visualize as opções e envie comprovante quando necessário.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_25rem]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Resumo do pedido
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Summary label="Serviço" value={appointment.service?.name ?? "Serviço"} />
              <Summary
                label="Profissional"
                value={appointment.professional?.user?.name ?? "Profissional"}
              />
              <Summary label="Data" value={formatDate(appointment.date)} />
              <Summary label="Horário" value={formatTime(appointment.startTime)} />
              <Summary label="Valor" value={formatCurrency(appointment.totalValue)} />
              <Summary
                label="Método"
                value={paymentMethodLabels[appointment.payment?.method ?? method]}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-white/10 bg-club-black p-4">
              <Badge tone={getPaymentStatusTone(paymentStatus)}>
                {paymentStatusLabels[paymentStatus]}
              </Badge>
              <p className="text-sm font-semibold text-zinc-300">
                O pagamento será validado pela equipe do Club do Rafa. Envie o
                comprovante se necessário ou apresente o pagamento presencialmente.
              </p>
            </div>

            {isPaid ? (
              <div className="mt-5 flex items-center gap-3 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
                <CheckCircle2 className="size-5" aria-hidden="true" />
                Este pagamento foi confirmado pela equipe.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Forma de pagamento
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {methods.map((item) => (
                <button
                  className={cn(
                    "flex min-h-20 items-center gap-3 rounded-md border border-white/10 bg-club-black p-3 text-left transition hover:border-club-red/50 disabled:cursor-not-allowed disabled:opacity-60",
                    method === item.value && "border-club-red bg-club-red/10 text-white",
                  )}
                  disabled={isPaid}
                  key={item.value}
                  onClick={() => setMethod(item.value)}
                  type="button"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-club-surface">
                    <item.icon className="size-5 text-club-red" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold uppercase text-white">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-zinc-500">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {method === "CARD" ? (
              <div className="mt-5 flex gap-3 rounded-lg border border-white/10 bg-club-black p-4 text-sm font-semibold leading-6 text-zinc-300">
                <Info className="mt-0.5 size-5 shrink-0 text-club-red" aria-hidden="true" />
                Pagamentos no cartao sao realizados via Infinity Pay.
              </div>
            ) : null}

            {appointment.payment?.infinityPayUrl && !isPaid ? (
              <a
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-club-red px-5 text-sm font-bold text-white transition hover:bg-red-700"
                href={appointment.payment.infinityPayUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Pagar via Infinity Pay
              </a>
            ) : null}

            {hasReceipt ? (
              <div className="mt-5 rounded-lg border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-100">
                <div className="flex items-center gap-2 font-semibold">
                  <FileText className="size-4" aria-hidden="true" />
                  Comprovante enviado
                </div>
                <a
                  className="mt-2 inline-flex font-bold text-white underline-offset-4 hover:underline"
                  href={appointment.payment?.receiptUrl ?? "#"}
                  rel="noreferrer"
                  target="_blank"
                >
                  {appointment.payment?.receiptFileName ?? "Ver comprovante"}
                </a>
              </div>
            ) : null}

            <div className="mt-5 rounded-lg border border-white/10 bg-club-black p-4">
              <Input
                accept="image/*,application/pdf"
                disabled={isPaid}
                label="Enviar comprovante"
                onChange={handleReceiptChange}
                type="file"
              />
              {receiptFileName ? (
                <p className="mt-3 text-xs font-semibold text-zinc-400">
                  Arquivo selecionado: {receiptFileName}
                </p>
              ) : null}
              <Button
                className="mt-4 w-full"
                disabled={isPaid || !receiptFile}
                isLoading={submitting}
                onClick={sendReceipt}
                type="button"
              >
                <UploadCloud className="size-4" aria-hidden="true" />
                Enviar comprovante
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-club-black p-4">
      <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}


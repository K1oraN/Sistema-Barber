import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Loading } from "../components/ui/Loading";
import { api } from "../services/api";
import type { ClientPlan, Plan } from "../types/domain";
import { getApiErrorMessage } from "../utils/apiError";
import { cn } from "../utils/cn";
import { formatCurrency, formatDate } from "../utils/format";
import { uploadReceipt, validateReceiptFile } from "../utils/receipts";
import {
  clientPlanStatusLabels,
  getClientPlanStatusTone,
  getPaymentStatusTone,
  paymentStatusLabels,
} from "../utils/status";

const planRequestMessage =
  "Sua solicitação de plano foi enviada. A equipe do Club do Rafa irá confirmar o pagamento e ativar o plano.";

export function PlansPage() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<ClientPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const [plansResponse, currentPlanResponse] = await Promise.all([
        api.get<Plan[]>("/plans?active=true"),
        api.get<ClientPlan | null>("/plans/subscriptions/me"),
      ]);

      setPlans(plansResponse.data);
      setCurrentPlan(currentPlanResponse.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const activeOrPendingPlanId = useMemo(() => {
    if (!currentPlan || currentPlan.status === "CANCELED" || currentPlan.status === "EXPIRED") {
      return null;
    }

    return currentPlan.planId;
  }, [currentPlan]);

  async function subscribe(planId: string) {
    try {
      setSubmittingId(planId);
      await api.post(`/plans/${planId}/subscribe`, {
        paymentStatus: "AWAITING_CONFIRMATION",
      });
      toast.success("Sua solicitacao foi enviada. Realize o pagamento conforme orientacao da equipe e envie o comprovante para analise.");
      await loadPlans();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleReceiptChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !currentPlan) {
      return;
    }

    const validationError = validateReceiptFile(file);

    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }

    try {
      setUploadingReceipt(true);
      const updatedPlan = await uploadReceipt<ClientPlan>(
        `/plans/subscriptions/${currentPlan.id}/receipt`,
        file,
      );
      setCurrentPlan(updatedPlan);
      toast.success("Comprovante enviado. Aguardando confirmacao.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploadingReceipt(false);
      event.target.value = "";
    }
  }

  if (loading) {
    return <Loading label="Carregando planos" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Button className="w-fit" onClick={() => navigate("/cliente")} size="sm" type="button" variant="secondary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold uppercase text-white sm:text-4xl">
              Planos
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Assinaturas mensais com beneficios do Club do Rafa.
            </p>
          </div>
        </div>
        <Badge tone={currentPlan ? getClientPlanStatusTone(currentPlan.status) : "zinc"}>
          {currentPlan ? clientPlanStatusLabels[currentPlan.status] : "Sem plano"}
        </Badge>
      </div>

      <Card>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase text-club-red">
                Plano atual
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold uppercase text-white">
                {currentPlan?.plan?.name ?? "Sem plano ativo"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Pagamento presencial, Pix ou cartao via Infinity Pay. A ativacao
                e sempre confirmada pela equipe.
              </p>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:w-96">
              <Summary
                icon={CreditCard}
                label="Status"
                value={currentPlan ? clientPlanStatusLabels[currentPlan.status] : "Sem plano"}
              />
              <Summary
                icon={CalendarClock}
                label="Vencimento"
                value={currentPlan?.endDate ? formatDate(currentPlan.endDate) : "-"}
              />
              <Summary
                icon={CreditCard}
                label="Pagamento"
                value={currentPlan ? paymentStatusLabels[currentPlan.paymentStatus] : "-"}
              />
              <Summary
                icon={UploadCloud}
                label="Comprovante"
                value={currentPlan?.receiptFileName ?? "Nao enviado"}
              />
            </div>
          </div>

          {currentPlan?.plan?.benefits?.length ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {currentPlan.plan.benefits.map((benefit) => (
                <span
                  className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-club-black px-3 text-sm font-semibold text-zinc-300"
                  key={benefit}
                >
                  <CheckCircle2 className="size-4 shrink-0 text-club-red" aria-hidden="true" />
                  {benefit}
                </span>
              ))}
            </div>
          ) : null}

          {currentPlan && currentPlan.status !== "ACTIVE" && currentPlan.status !== "CANCELED" ? (
            <div className="mt-5 rounded-lg border border-white/10 bg-club-black p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={getPaymentStatusTone(currentPlan.paymentStatus)}>
                  {paymentStatusLabels[currentPlan.paymentStatus]}
                </Badge>
                <p className="text-sm font-semibold text-zinc-300">
                  O plano so sera ativado apos aprovacao da equipe.
                </p>
              </div>

              {currentPlan.infinityPayUrl ? (
                <a
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-club-red px-5 text-sm font-bold text-white transition hover:bg-red-700 sm:w-auto"
                  href={currentPlan.infinityPayUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Pagar via Infinity Pay
                </a>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">
                  A equipe ainda nao cadastrou um link Infinity Pay para esta solicitacao.
                </p>
              )}

              <label className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 text-sm font-bold text-zinc-100 transition hover:border-white/20 hover:bg-white/10 sm:w-auto">
                <UploadCloud className="size-4" aria-hidden="true" />
                {uploadingReceipt ? "Enviando" : "Enviar comprovante"}
                <input
                  accept="image/png,image/jpeg,application/pdf"
                  className="sr-only"
                  disabled={uploadingReceipt}
                  onChange={handleReceiptChange}
                  type="file"
                />
              </label>

              {currentPlan.receiptUrl ? (
                <a
                  className="mt-3 block text-sm font-bold text-club-red underline-offset-4 hover:underline"
                  href={currentPlan.receiptUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {currentPlan.receiptFileName ?? "Ver comprovante enviado"}
                </a>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {plans.length ? (
        <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = activeOrPendingPlanId === plan.id;
            const disabled = Boolean(activeOrPendingPlanId);

            return (
              <Card
                className={cn(
                  "relative flex h-full min-h-[31rem] min-w-0 flex-col overflow-hidden transition hover:-translate-y-1 hover:border-club-red/40",
                  plan.highlighted && "border-club-red/50 bg-club-red/[0.04]",
                )}
                key={plan.id}
              >
                {plan.highlighted ? (
                  <Badge className="absolute right-4 top-4" tone="red">
                    Recomendado
                  </Badge>
                ) : null}
                <CardContent className="flex h-full flex-1 flex-col">
                  <Sparkles className="size-6 text-club-red" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-3xl font-semibold uppercase text-white">
                    {plan.name}
                  </h2>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-500">
                    {plan.description}
                  </p>
                  <strong className="mt-5 block font-display text-4xl text-white">
                    {formatCurrency(plan.price)}
                    <span className="ml-1 text-sm font-semibold text-zinc-500">
                      /mes
                    </span>
                  </strong>
                  <div className="mt-5 space-y-2 pb-6">
                    {plan.benefits.map((benefit) => (
                      <p className="flex items-center gap-2 text-sm text-zinc-300" key={benefit}>
                        <CheckCircle2 className="size-4 shrink-0 text-club-red" aria-hidden="true" />
                        {benefit}
                      </p>
                    ))}
                  </div>
                  <Button
                    className="mt-auto w-full"
                    disabled={disabled && !isCurrent}
                    isLoading={submittingId === plan.id}
                    onClick={() => subscribe(plan.id)}
                    type="button"
                    variant={isCurrent ? "secondary" : "primary"}
                  >
                    {isCurrent ? "Solicitado" : "Assinar plano"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          description="Os planos ativos aparecem aqui quando forem publicados."
          icon={CreditCard}
          title="Sem planos"
        />
      )}
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-club-black p-4">
      <Icon className="size-5 text-club-red" aria-hidden="true" />
      <p className="mt-3 text-xs font-bold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

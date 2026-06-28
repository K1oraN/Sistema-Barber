import {
  CalendarPlus,
  Ban,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  Package,
  Phone,
  Scissors,
  UserRound,
  WalletCards,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { StatCard } from "../components/ui/StatCard";
import {
  AppointmentFormModal,
  type AppointmentFormSubmitData,
} from "../components/appointments/AppointmentFormModal";
import { CancelAppointmentModal } from "../components/appointments/CancelAppointmentModal";
import { PaymentConfirmationModal } from "../components/appointments/PaymentConfirmationModal";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type {
  Appointment,
  Payment,
  ProductOrder,
  Professional,
  ProfessionalTimeBlock,
  Service,
} from "../types/domain";
import type { User } from "../types/auth";
import { getApiErrorMessage } from "../utils/apiError";
import { cn } from "../utils/cn";
import { formatCurrency, formatTime } from "../utils/format";
import {
  appointmentStatusLabels,
  getAppointmentStatusTone,
  getPaymentStatusTone,
  paymentStatusLabels,
} from "../utils/status";
import {
  timeBlockSchema,
  type TimeBlockFormData,
} from "../validations/professionalValidation";
import { zodResolver } from "@hookform/resolvers/zod";

type AppointmentAction = "confirm" | "finish";
type ProfessionalTab = "agenda" | "produtos";

const productOrderStatusLabels: Record<ProductOrder["status"], string> = {
  AVAILABLE_FOR_PICKUP: "Disponivel para retirada",
  CANCELED: "Cancelado",
  DELIVERED: "Entregue",
  ORDERED: "Encomendado",
  PRE_ORDER_REQUESTED: "Encomenda solicitada",
  RESERVED: "Reservado",
  UNDER_REVIEW: "Em analise",
};

const productOrderTypeLabels: Record<ProductOrder["orderType"], string> = {
  PRE_ORDER: "Encomenda",
  RESERVATION: "Reserva",
};

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function appointmentDateKey(appointment: Appointment) {
  return appointment.date.slice(0, 10);
}

function timeValue(value: string) {
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : formatTime(value);
}

function localDateFromKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function appointmentStartDate(appointment: Appointment) {
  return new Date(`${appointmentDateKey(appointment)}T${timeValue(appointment.startTime)}:00`);
}

function formatLocalDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(localDateFromKey(value.slice(0, 10)));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  }).format(localDateFromKey(value.slice(0, 10)));
}

function isSameWeek(date: Date, reference: Date) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function isSameMonth(date: Date, reference: Date) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function professionalEarning(appointment: Appointment, professional: Professional | null) {
  const grossValue = Number(appointment.totalValue);
  const commissionPercent = Number(professional?.commissionPercent);

  if (!Number.isFinite(commissionPercent)) {
    return grossValue;
  }

  return grossValue * (commissionPercent / 100);
}

function sumEarnings(
  appointments: Appointment[],
  professional: Professional | null,
  predicate: (appointment: Appointment) => boolean,
) {
  return appointments
    .filter((appointment) => appointment.status === "FINISHED")
    .filter(predicate)
    .reduce(
      (sum, appointment) => sum + professionalEarning(appointment, professional),
      0,
    );
}

function getProductOrderTone(status: ProductOrder["status"]) {
  if (status === "RESERVED" || status === "PRE_ORDER_REQUESTED") {
    return "amber";
  }

  if (status === "UNDER_REVIEW" || status === "ORDERED") {
    return "blue";
  }

  if (status === "CANCELED") {
    return "red";
  }

  return "green";
}

export function ProfessionalDashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfessionalTab>("agenda");
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blocks, setBlocks] = useState<ProfessionalTimeBlock[]>([]);
  const [cancelingAppointment, setCancelingAppointment] =
    useState<Appointment | null>(null);
  const [clients, setClients] = useState<User[]>([]);
  const [confirmingPaymentAppointment, setConfirmingPaymentAppointment] =
    useState<Appointment | null>(null);
  const [finishConfirmAppointment, setFinishConfirmAppointment] =
    useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [creatingBlock, setCreatingBlock] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const [
        professionalResponse,
        appointmentsResponse,
        blocksResponse,
        clientsResponse,
        servicesResponse,
        productOrdersResponse,
      ] =
        await Promise.all([
          api.get<Professional>("/professionals/me"),
          api.get<Appointment[]>("/appointments"),
          api.get<ProfessionalTimeBlock[]>("/professionals/me/blocks"),
          api.get<User[]>("/users/clients"),
          api.get<Service[]>("/services?active=true"),
          api.get<ProductOrder[]>("/product-orders"),
        ]);

      setProfessional(professionalResponse.data);
      setAppointments(appointmentsResponse.data);
      setBlocks(blocksResponse.data);
      setClients(clientsResponse.data);
      setServices(servicesResponse.data);
      setProductOrders(productOrdersResponse.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const todayKey = useMemo(() => toDateInput(new Date()), []);
  const now = new Date();
  const finishedAppointments = appointments.filter(
    (appointment) => appointment.status === "FINISHED",
  );
  const todayAppointments = appointments
    .filter((appointment) => appointmentDateKey(appointment) === todayKey)
    .sort(
      (a, b) =>
        appointmentStartDate(a).getTime() - appointmentStartDate(b).getTime(),
    );
  const upcomingAppointments = appointments
    .filter((appointment) => appointment.status !== "CANCELED")
    .filter((appointment) => appointment.status !== "FINISHED")
    .filter((appointment) => appointmentDateKey(appointment) > todayKey)
    .sort(
      (a, b) =>
        appointmentStartDate(a).getTime() - appointmentStartDate(b).getTime(),
    )
    .slice(0, 8);

  const earningsToday = sumEarnings(
    appointments,
    professional,
    (appointment) => appointmentDateKey(appointment) === todayKey,
  );
  const earningsWeek = sumEarnings(appointments, professional, (appointment) =>
    isSameWeek(appointmentStartDate(appointment), now),
  );
  const earningsMonth = sumEarnings(appointments, professional, (appointment) =>
    isSameMonth(appointmentStartDate(appointment), now),
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function updateOnlineStatus(nextOnline: boolean) {
    try {
      setSavingStatus(true);
      const { data } = await api.patch<Professional>("/professionals/me/status", {
        online: nextOnline,
      });
      setProfessional(data);
      toast.success(nextOnline ? "Status online ativado." : "Status offline ativado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSavingStatus(false);
    }
  }

  async function createAppointment(data: AppointmentFormSubmitData) {
    try {
      setRunningAction("create-appointment");
      let clientId = data.clientId;

      if (data.quickClient) {
        const { data: createdClient } = await api.post<User>(
          "/users/clients",
          data.quickClient,
        );
        clientId = createdClient.id;
      }

      await api.post("/appointments", {
        clientId,
        date: data.date,
        endTime: data.endTime,
        isExtraSlot: data.isExtraSlot,
        notes: data.notes,
        paymentMethod: "PIX",
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        totalValue: data.totalValue,
      });

      toast.success(data.isExtraSlot ? "Encaixe criado." : "Agendamento criado.");
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setRunningAction(null);
    }
  }

  async function cancelAppointment(reason: string) {
    if (!cancelingAppointment) {
      return;
    }

    try {
      setRunningAction(`cancel:${cancelingAppointment.id}`);
      await api.put(`/appointments/${cancelingAppointment.id}`, {
        cancelReason: reason || null,
        status: "CANCELED",
      });
      toast.success("Agendamento desmarcado.");
      setCancelingAppointment(null);
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function confirmPayment(data: {
    confirmationNote: string | null;
    method: Payment["method"];
  }) {
    if (!confirmingPaymentAppointment) {
      return;
    }

    try {
      setRunningAction(`payment:${confirmingPaymentAppointment.id}`);
      if (confirmingPaymentAppointment.payment?.id) {
        await api.put(`/payments/${confirmingPaymentAppointment.payment.id}`, {
          confirmationNote: data.confirmationNote,
          method: data.method,
          status: "PAID",
        });
      } else {
        await api.post("/payments", {
          amount: confirmingPaymentAppointment.totalValue,
          appointmentId: confirmingPaymentAppointment.id,
          confirmationNote: data.confirmationNote,
          method: data.method,
          status: "PAID",
        });
      }

      toast.success("Pagamento confirmado.");
      setConfirmingPaymentAppointment(null);
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function finishAppointment(appointment: Appointment) {
    try {
      setRunningAction(`finish:${appointment.id}`);
      await api.post(`/appointments/${appointment.id}/finish`);
      toast.success("Atendimento finalizado com sucesso.");
      setFinishConfirmAppointment(null);
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function runAppointmentAction(
    appointment: Appointment,
    action: AppointmentAction,
  ) {
    const actionKey = `${action}:${appointment.id}`;

    try {
      setRunningAction(actionKey);

      if (action === "confirm") {
        await api.put(`/appointments/${appointment.id}`, { status: "CONFIRMED" });
        toast.success("Agendamento confirmado.");
      }

      if (action === "finish") {
        const paymentStatus = appointment.payment?.status ?? "PENDING";

        if (paymentStatus !== "PAID") {
          setFinishConfirmAppointment(appointment);
          return;
        }

        await finishAppointment(appointment);
      }

      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function createTimeBlock(data: TimeBlockFormData) {
    try {
      setCreatingBlock(true);
      await api.post("/professionals/me/blocks", {
        date: data.date,
        endTime: data.endTime,
        reason: data.reason?.trim() || null,
        startTime: data.startTime,
      });
      toast.success("Horario bloqueado.");
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreatingBlock(false);
    }
  }

  async function updateProductOrder(
    order: ProductOrder,
    data: Partial<Pick<ProductOrder, "paymentMethod" | "paymentStatus" | "status">>,
  ) {
    try {
      setRunningAction(`product-order:${order.id}`);
      await api.put(`/product-orders/${order.id}`, data);
      toast.success("Pedido atualizado.");
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-club-black text-white">
        <Loading label="Carregando area do colaborador" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-club-black text-white">
      <ProfessionalHeader
        onLogout={handleLogout}
        professional={professional}
        user={user}
      />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-2 rounded-md border border-white/10 bg-club-surface p-2 sm:inline-grid sm:grid-cols-2">
          <TabButton
            active={activeTab === "agenda"}
            icon={CalendarDays}
            label="Agenda"
            onClick={() => setActiveTab("agenda")}
          />
          <TabButton
            active={activeTab === "produtos"}
            icon={Package}
            label="Produtos"
            onClick={() => setActiveTab("produtos")}
          />
        </div>

        {activeTab === "agenda" ? (
          <>
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-club-surface/95">
            <CardContent>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <ProfessionalAvatar user={professional?.user ?? user} size="lg" />
                  <div>
                    <Badge tone={professional?.online ? "green" : "zinc"}>
                      {professional?.online ? "Online" : "Offline"}
                    </Badge>
                    <h1 className="mt-3 font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
                      {professional?.user?.name?.trim() ||
                        user?.name?.trim() ||
                        user?.email ||
                        "Profissional"}
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-zinc-400">
                      {professional?.specialty ?? "Especialidade nao informada"}
                    </p>
                  </div>
                </div>

                <OnlineToggle
                  isLoading={savingStatus}
                  online={Boolean(professional?.online)}
                  onChange={updateOnlineStatus}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-club-red/30 bg-gradient-to-br from-club-red/15 to-club-surface">
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase text-red-100">
                    Atendimento
                  </p>
                  <strong className="mt-3 block font-display text-5xl font-semibold text-white">
                    {todayAppointments.length}
                  </strong>
                  <p className="mt-2 text-sm text-zinc-300">agenda de hoje</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-md bg-club-red text-white">
                  <CalendarDays className="size-6" aria-hidden="true" />
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            detail="comissao do dia"
            icon={WalletCards}
            label="Ganhos hoje"
            value={formatCurrency(earningsToday)}
          />
          <StatCard
            detail="semana atual"
            icon={CalendarCheck}
            label="Ganhos da semana"
            value={formatCurrency(earningsWeek)}
          />
          <StatCard
            detail="mes atual"
            icon={CalendarDays}
            label="Ganhos do mes"
            value={formatCurrency(earningsMonth)}
          />
          <StatCard
            detail="todos os periodos"
            icon={CheckCircle2}
            label="Finalizados"
            value={String(finishedAppointments.length)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-display text-3xl font-semibold uppercase text-white">
                  Agenda do dia
                </h2>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Badge tone="red">{formatLocalDate(todayKey)}</Badge>
                  <Button
                    onClick={() => setAppointmentModalOpen(true)}
                    size="sm"
                    type="button"
                  >
                    <CalendarPlus className="size-4" aria-hidden="true" />
                    Novo agendamento
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {todayAppointments.length ? (
                <div className="space-y-3">
                  {todayAppointments.map((appointment) => (
                    <AppointmentCard
                      actionKey={runningAction}
                      appointment={appointment}
                      key={appointment.id}
                      onCancel={setCancelingAppointment}
                      onConfirmPayment={setConfirmingPaymentAppointment}
                      onAction={runAppointmentAction}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  description="Nenhum horario marcado para hoje."
                  icon={Clock3}
                  title="Agenda livre"
                />
              )}
            </CardContent>
          </Card>

          <TimeBlockPanel
            blocks={blocks}
            isLoading={creatingBlock}
            minDate={todayKey}
            onCreate={createTimeBlock}
          />
        </section>

        <Card>
          <CardHeader>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Proximos agendamentos
            </h2>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    actionKey={runningAction}
                    appointment={appointment}
                    key={appointment.id}
                    onAction={runAppointmentAction}
                    onCancel={setCancelingAppointment}
                    onConfirmPayment={setConfirmingPaymentAppointment}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                description="Os proximos dias aparecem aqui quando houver agenda."
                icon={CalendarDays}
                title="Sem proximos horarios"
              />
            )}
          </CardContent>
        </Card>
          </>
        ) : (
          <ProfessionalProductsPanel
            onUpdate={updateProductOrder}
            orders={productOrders}
            runningAction={runningAction}
            todayKey={todayKey}
          />
        )}
      </main>

      <AppointmentFormModal
        clients={clients}
        isLoading={runningAction === "create-appointment"}
        isOpen={appointmentModalOpen}
        lockedProfessionalId={professional?.id}
        onClose={() => setAppointmentModalOpen(false)}
        onSubmit={createAppointment}
        professionals={professional ? [professional] : []}
        services={services}
      />
      <CancelAppointmentModal
        appointment={cancelingAppointment}
        isLoading={Boolean(
          cancelingAppointment &&
            runningAction === `cancel:${cancelingAppointment.id}`,
        )}
        onClose={() => setCancelingAppointment(null)}
        onConfirm={cancelAppointment}
      />
      <PaymentConfirmationModal
        appointment={confirmingPaymentAppointment}
        isLoading={Boolean(
          confirmingPaymentAppointment &&
            runningAction === `payment:${confirmingPaymentAppointment.id}`,
        )}
        onClose={() => setConfirmingPaymentAppointment(null)}
        onConfirm={confirmPayment}
      />
      <ConfirmDialog
        confirmLabel="Finalizar mesmo assim"
        description="O pagamento ainda não foi confirmado. Deseja finalizar mesmo assim?"
        isLoading={Boolean(
          finishConfirmAppointment &&
            runningAction === `finish:${finishConfirmAppointment.id}`,
        )}
        isOpen={Boolean(finishConfirmAppointment)}
        onClose={() => setFinishConfirmAppointment(null)}
        onConfirm={() => {
          if (finishConfirmAppointment) {
            finishAppointment(finishConfirmAppointment);
          }
        }}
        title="Finalizar atendimento"
      />
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof CalendarDays;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white",
        active && "bg-club-red text-white hover:bg-club-red",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function ProfessionalProductsPanel({
  onUpdate,
  orders,
  runningAction,
  todayKey,
}: {
  onUpdate: (
    order: ProductOrder,
    data: Partial<Pick<ProductOrder, "paymentMethod" | "paymentStatus" | "status">>,
  ) => void;
  orders: ProductOrder[];
  runningAction: string | null;
  todayKey: string;
}) {
  const todayReservations = orders.filter(
    (order) =>
      order.orderType === "RESERVATION" &&
      order.status === "RESERVED" &&
      order.createdAt.slice(0, 10) === todayKey,
  );
  const pickupOrders = orders.filter(
    (order) => order.status === "AVAILABLE_FOR_PICKUP",
  );
  const visibleOrders = [...todayReservations, ...pickupOrders].filter(
    (order, index, list) => list.findIndex((item) => item.id === order.id) === index,
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="criadas hoje"
          icon={Package}
          label="Reservas"
          value={String(todayReservations.length)}
        />
        <StatCard
          detail="retirada liberada"
          icon={CheckCircle2}
          label="Disponiveis"
          value={String(pickupOrders.length)}
        />
        <StatCard
          detail="sem editar cadastro"
          icon={WalletCards}
          label="Pagamentos"
          value={String(visibleOrders.filter((order) => order.paymentStatus !== "PAID").length)}
        />
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-display text-3xl font-semibold uppercase text-white">
            Produtos
          </h2>
        </CardHeader>
        <CardContent>
          {visibleOrders.length ? (
            <div className="space-y-3">
              {visibleOrders.map((order) => (
                <ProfessionalProductOrderCard
                  key={order.id}
                  onUpdate={onUpdate}
                  order={order}
                  runningAction={runningAction}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              description="Reservas de hoje e encomendas para retirada aparecem aqui."
              icon={Package}
              title="Sem produtos pendentes"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfessionalProductOrderCard({
  onUpdate,
  order,
  runningAction,
}: {
  onUpdate: (
    order: ProductOrder,
    data: Partial<Pick<ProductOrder, "paymentMethod" | "paymentStatus" | "status">>,
  ) => void;
  order: ProductOrder;
  runningAction: string | null;
}) {
  const firstItem = order.items?.[0];
  const canConfirmPayment =
    order.paymentStatus !== "PAID" &&
    order.paymentStatus !== "CANCELED" &&
    order.status !== "CANCELED";
  const canDeliver =
    order.status === "RESERVED" || order.status === "AVAILABLE_FOR_PICKUP";

  return (
    <article className="grid gap-4 rounded-md border border-white/10 bg-club-black p-4 lg:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <strong className="font-display text-2xl font-semibold uppercase text-white">
            {firstItem?.product?.name ?? "Produto"}
          </strong>
          <Badge tone={getProductOrderTone(order.status)}>
            {productOrderStatusLabels[order.status]}
          </Badge>
          <Badge tone={getPaymentStatusTone(order.paymentStatus)}>
            {paymentStatusLabels[order.paymentStatus]}
          </Badge>
          <Badge tone="zinc">{productOrderTypeLabels[order.orderType]}</Badge>
        </div>
        <div className="mt-3 grid gap-2 text-sm text-zinc-400 sm:grid-cols-3">
          <InfoLine icon={UserRound} value={order.client?.name ?? "Cliente"} />
          <InfoLine icon={Package} value={`${firstItem?.quantity ?? 0} unidade(s)`} />
          <InfoLine icon={WalletCards} value={formatCurrency(order.total)} />
        </div>
        {order.receiptUrl ? (
          <a
            className="mt-3 inline-flex text-sm font-bold text-club-red underline-offset-4 hover:underline"
            href={order.receiptUrl}
            rel="noreferrer"
            target="_blank"
          >
            {order.receiptFileName ?? "Ver comprovante"}
          </a>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        {canConfirmPayment ? (
          <Button
            isLoading={runningAction === `product-order:${order.id}`}
            onClick={() =>
              onUpdate(order, {
                paymentMethod: order.paymentMethod ?? "PIX",
                paymentStatus: "PAID",
              })
            }
            size="sm"
            type="button"
          >
            <WalletCards className="size-4" aria-hidden="true" />
            Confirmar pagamento
          </Button>
        ) : null}
        <Button
          disabled={!canDeliver}
          isLoading={runningAction === `product-order:${order.id}`}
          onClick={() => onUpdate(order, { status: "DELIVERED" })}
          size="sm"
          type="button"
          variant="secondary"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Confirmar retirada
        </Button>
      </div>
    </article>
  );
}

function ProfessionalHeader({
  onLogout,
  professional,
  user,
}: {
  onLogout: () => void;
  professional: Professional | null;
  user: User | null;
}) {
  const displayUser = professional?.user ?? user;
  const displayName =
    displayUser?.name?.trim() || displayUser?.email || "Profissional";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-club-black/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md border border-white/10 bg-club-surface">
            <Scissors className="size-5 text-club-red" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold uppercase leading-none text-white sm:text-3xl">
              CLUB DO RAFA
            </p>
            <p className="hidden text-xs font-bold uppercase text-zinc-500 sm:block">
              area do profissional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 sm:flex">
            <ProfessionalAvatar user={displayUser} />
            <div className="min-w-0">
              <p className="max-w-44 truncate text-sm font-bold text-white">
                {displayName}
              </p>
              <p className="max-w-44 truncate text-xs text-zinc-500">
                {professional?.specialty ?? "Colaborador"}
              </p>
            </div>
          </div>
          <Button onClick={onLogout} size="sm" type="button" variant="secondary">
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function ProfessionalAvatar({
  size = "md",
  user,
}: {
  size?: "md" | "lg";
  user?: User | null;
}) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-md border border-white/10 bg-club-black",
        size === "md" && "size-10",
        size === "lg" && "size-20",
      )}
    >
      {user?.avatarUrl ? (
        <img
          alt={user.name}
          className="h-full w-full object-cover"
          src={user.avatarUrl}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <UserRound
            className={cn("text-club-red", size === "md" ? "size-5" : "size-9")}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

function OnlineToggle({
  isLoading,
  onChange,
  online,
}: {
  isLoading: boolean;
  onChange: (online: boolean) => void;
  online: boolean;
}) {
  return (
    <button
      aria-pressed={online}
      className={cn(
        "flex min-h-14 w-full items-center justify-between gap-4 rounded-md border px-4 text-left transition sm:w-64",
        online
          ? "border-emerald-400/40 bg-emerald-400/10"
          : "border-white/10 bg-club-black",
      )}
      disabled={isLoading}
      onClick={() => onChange(!online)}
      type="button"
    >
      <span className="flex items-center gap-3">
        {online ? (
          <Wifi className="size-5 text-emerald-300" aria-hidden="true" />
        ) : (
          <WifiOff className="size-5 text-zinc-500" aria-hidden="true" />
        )}
        <span>
          <span className="block text-sm font-bold text-white">
            {online ? "Online" : "Offline"}
          </span>
          <span className="block text-xs font-semibold text-zinc-500">
            {isLoading
              ? "Atualizando"
              : online
                ? "Disponivel na agenda"
                : "Fora da agenda"}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "flex h-7 w-12 items-center rounded-full border p-1 transition",
          online
            ? "justify-end border-emerald-400/40 bg-emerald-400/20"
            : "justify-start border-white/10 bg-white/5",
        )}
      >
        <span className="size-5 rounded-full bg-white" />
      </span>
    </button>
  );
}

function AppointmentCard({
  actionKey,
  appointment,
  onAction,
  onCancel,
  onConfirmPayment,
}: {
  actionKey: string | null;
  appointment: Appointment;
  onAction: (appointment: Appointment, action: AppointmentAction) => void;
  onCancel: (appointment: Appointment) => void;
  onConfirmPayment: (appointment: Appointment) => void;
}) {
  const canConfirm = appointment.status === "SCHEDULED";
  const canCancel =
    appointment.status !== "CANCELED" && appointment.status !== "FINISHED";
  const canFinish =
    appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";
  const paymentStatus = appointment.payment?.status ?? "PENDING";
  const canConfirmPayment =
    appointment.status !== "CANCELED" &&
    (paymentStatus === "PENDING" || paymentStatus === "AWAITING_CONFIRMATION");

  return (
    <article className="grid gap-4 rounded-md border border-white/10 bg-club-black p-4 transition hover:border-club-red/45 lg:grid-cols-[8rem_1fr_auto]">
      <div className="rounded-md border border-club-red/20 bg-club-red/10 p-4">
        <p className="font-display text-3xl font-semibold text-white">
          {timeValue(appointment.startTime)}
        </p>
        <p className="mt-1 text-xs font-bold uppercase text-red-100">
          {timeValue(appointment.endTime)}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <strong className="font-display text-2xl font-semibold uppercase text-white">
            {appointment.service?.name ?? "Servico"}
          </strong>
          <Badge tone={getAppointmentStatusTone(appointment.status)}>
            {appointmentStatusLabels[appointment.status]}
          </Badge>
          <Badge tone={getPaymentStatusTone(paymentStatus)}>
            {paymentStatusLabels[paymentStatus]}
          </Badge>
          {appointment.isExtraSlot ? <Badge tone="red">Encaixe</Badge> : null}
        </div>
        <div className="mt-3 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
          <InfoLine icon={UserRound} value={appointment.client?.name ?? "Cliente"} />
          <InfoLine icon={Phone} value={appointment.client?.phone ?? "Sem telefone"} />
          <InfoLine
            icon={WalletCards}
            value={formatCurrency(appointment.totalValue)}
          />
          <InfoLine icon={CalendarCheck} value={formatLocalDate(appointment.date)} />
        </div>
        {appointment.payment?.receiptUrl ? (
          <a
            className="mt-3 inline-flex text-sm font-bold text-club-red underline-offset-4 hover:underline"
            href={appointment.payment.receiptUrl}
            rel="noreferrer"
            target="_blank"
          >
            {appointment.payment.receiptFileName ?? "Ver comprovante"}
          </a>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:justify-center">
        {canConfirmPayment ? (
          <Button
            isLoading={actionKey === `payment:${appointment.id}`}
            onClick={() => onConfirmPayment(appointment)}
            size="sm"
            type="button"
          >
            <WalletCards className="size-4" aria-hidden="true" />
            Confirmar pagamento
          </Button>
        ) : null}
        <Button
          disabled={!canConfirm}
          isLoading={actionKey === `confirm:${appointment.id}`}
          onClick={() => onAction(appointment, "confirm")}
          size="sm"
          type="button"
          variant="secondary"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Confirmar
        </Button>
        <Button
          disabled={!canCancel}
          isLoading={actionKey === `cancel:${appointment.id}`}
          onClick={() => onCancel(appointment)}
          size="sm"
          type="button"
          variant="danger"
        >
          <XCircle className="size-4" aria-hidden="true" />
          Cancelar
        </Button>
        <Button
          disabled={!canFinish}
          isLoading={actionKey === `finish:${appointment.id}`}
          onClick={() => onAction(appointment, "finish")}
          size="sm"
          type="button"
        >
          <Scissors className="size-4" aria-hidden="true" />
          Finalizar
        </Button>
      </div>
    </article>
  );
}

function InfoLine({
  icon: Icon,
  value,
}: {
  icon: typeof UserRound;
  value: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-club-red" aria-hidden="true" />
      <span className="truncate">{value}</span>
    </span>
  );
}

function TimeBlockPanel({
  blocks,
  isLoading,
  minDate,
  onCreate,
}: {
  blocks: ProfessionalTimeBlock[];
  isLoading: boolean;
  minDate: string;
  onCreate: (data: TimeBlockFormData) => Promise<void>;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TimeBlockFormData>({
    defaultValues: {
      date: minDate,
      endTime: "12:30",
      reason: "",
      startTime: "12:00",
    },
    mode: "onTouched",
    resolver: zodResolver(timeBlockSchema),
  });

  async function submit(data: TimeBlockFormData) {
    await onCreate(data);
    reset({
      date: data.date,
      endTime: data.endTime,
      reason: "",
      startTime: data.startTime,
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold uppercase text-white">
            Bloqueio
          </h2>
          <span className="flex size-10 items-center justify-center rounded-md bg-club-red/10 text-club-red">
            <Ban className="size-5" aria-hidden="true" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="space-y-5" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-3 sm:grid-cols-2">
          <Input
            error={errors.date?.message}
            label="Data"
            min={minDate}
            type="date"
            {...register("date")}
          />
          <Input
            error={errors.startTime?.message}
            label="Inicio"
            type="time"
            {...register("startTime")}
          />
          <Input
            error={errors.endTime?.message}
            label="Fim"
            type="time"
            {...register("endTime")}
          />
          <Input
            error={errors.reason?.message}
            label="Motivo"
            placeholder="Opcional"
            {...register("reason")}
          />
          </div>

          <Button
            className="w-full"
            isLoading={isLoading}
            type="submit"
          >
            <Ban className="size-4" aria-hidden="true" />
            Bloquear horario
          </Button>
        </form>

        <div className="space-y-2">
          {blocks.slice(0, 4).map((block) => (
            <div
              className="rounded-md border border-white/10 bg-club-black p-3"
              key={block.id}
            >
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm font-bold text-white">
                  {formatShortDate(block.date)}
                </strong>
                <Badge tone="zinc">
                  {timeValue(block.startTime)} - {timeValue(block.endTime)}
                </Badge>
              </div>
              {block.reason ? (
                <p className="mt-2 text-xs font-semibold text-zinc-500">
                  {block.reason}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

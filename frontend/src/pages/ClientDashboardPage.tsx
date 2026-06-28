import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gift,
  Search,
  Scissors,
  Sparkles,
  Trophy,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Loading } from "../components/ui/Loading";
import { StatCard } from "../components/ui/StatCard";
import {
  OPENING_HOURS,
  formatOpeningPeriods,
  getServiceDurationLabel,
} from "../constants/barbershop";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type {
  Appointment,
  AvailabilityResponse,
  AvailabilitySlot,
  Professional,
  Reward,
  Service,
} from "../types/domain";
import { getApiErrorMessage } from "../utils/apiError";
import { cn } from "../utils/cn";
import { formatCurrency, formatDate, formatTime } from "../utils/format";
import {
  appointmentStatusLabels,
  getPaymentStatusTone,
  paymentStatusLabels,
} from "../utils/status";

const offerImage =
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1400&q=85";

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function makeDateOptions() {
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      label: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        weekday: "short",
      }).format(date),
      value: toDateInput(date),
    };
  });
}

function getAppointmentTimeValue(value: string) {
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : formatTime(value);
}

function isHalfHourTime(value: string) {
  const time = getAppointmentTimeValue(value);
  return time.endsWith(":00") || time.endsWith(":30");
}

function appointmentStartDate(appointment: Appointment) {
  const date = appointment.date.slice(0, 10);
  const time = getAppointmentTimeValue(appointment.startTime);
  return new Date(`${date}T${time}:00`);
}

function getStatusTone(status: Appointment["status"]) {
  if (status === "SCHEDULED") {
    return "amber";
  }

  if (status === "CONFIRMED") {
    return "blue";
  }

  if (status === "CANCELED") {
    return "red";
  }

  return "green";
}

export function ClientDashboardPage() {
  const { refreshUser, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [servicesResponse, professionalsResponse, appointmentsResponse, rewardsResponse] =
        await Promise.all([
          api.get<Service[]>("/services?active=true"),
          api.get<Professional[]>("/professionals?active=true"),
          api.get<Appointment[]>("/appointments"),
          api.get<Reward[]>("/rewards?active=true"),
        ]);

      setServices(servicesResponse.data);
      setProfessionals(professionalsResponse.data);
      setAppointments(appointmentsResponse.data);
      setRewards(rewardsResponse.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    async function loadAvailability() {
      setSelectedSlot(null);
      setAvailability([]);

      if (!selectedProfessionalId || !selectedServiceId || !selectedDate) {
        return;
      }

      try {
        setLoadingAvailability(true);
        const { data } = await api.get<AvailabilityResponse>(
          "/appointments/availability",
          {
            params: {
              date: selectedDate,
              professionalId: selectedProfessionalId,
              serviceId: selectedServiceId,
            },
          },
        );
        setAvailability(
          data.slots.filter((slot) => slot.available && isHalfHourTime(slot.startTime)),
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoadingAvailability(false);
      }
    }

    loadAvailability();
  }, [selectedDate, selectedProfessionalId, selectedServiceId]);

  const selectedService = services.find((service) => service.id === selectedServiceId);
  const selectedProfessional = professionals.find(
    (professional) => professional.id === selectedProfessionalId,
  );
  const canLoadAvailability = Boolean(
    selectedProfessionalId && selectedServiceId && selectedDate,
  );
  const dateOptions = useMemo(makeDateOptions, []);
  const filteredServices = useMemo(() => {
    const term = serviceSearch.trim().toLocaleLowerCase("pt-BR");

    if (!term) {
      return services;
    }

    return services.filter((service) =>
      service.name.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [serviceSearch, services]);
  const nextReward = useMemo(() => {
    const points = user?.points ?? 0;
    return rewards
      .filter((reward) => reward.requiredPoints > points)
      .sort((a, b) => a.requiredPoints - b.requiredPoints)[0];
  }, [rewards, user?.points]);
  const currentPoints = user?.points ?? 0;
  const targetPoints = nextReward?.requiredPoints ?? Math.max(currentPoints, 1);
  const missingPoints = Math.max(targetPoints - currentPoints, 0);
  const progress = nextReward
    ? Math.min(Math.round((currentPoints / targetPoints) * 100), 100)
    : 100;

  const upcomingAppointments = appointments
    .filter((appointment) => appointment.status !== "CANCELED")
    .filter((appointment) => appointment.status !== "FINISHED")
    .filter((appointment) => appointmentStartDate(appointment) >= new Date())
    .sort(
      (a, b) =>
        appointmentStartDate(a).getTime() - appointmentStartDate(b).getTime(),
    );
  const historyAppointments = appointments
    .filter((appointment) => appointment.status === "FINISHED")
    .slice(0, 5);

  function validateScheduleSelection() {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedSlot) {
      toast.error("Escolha serviço, profissional, data e horário.");
      return false;
    }

    const startsAt = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);

    if (startsAt < new Date()) {
      toast.error("Não é permitido confirmar horário passado.");
      return false;
    }

    return true;
  }

  async function createAppointment() {
    if (!validateScheduleSelection() || !selectedService || !selectedSlot) {
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/appointments", {
        date: selectedDate,
        endTime: selectedSlot.endTime,
        paymentMethod: "PIX",
        professionalId: selectedProfessionalId,
        serviceId: selectedServiceId,
        startTime: selectedSlot.startTime,
        totalValue: selectedService.price,
      });
      toast.success("Agendamento realizado! O pagamento será confirmado pela equipe.");
      setSelectedServiceId("");
      setSelectedProfessionalId("");
      setSelectedDate("");
      setSelectedSlot(null);
      setAvailability([]);
      await Promise.all([loadDashboard(), refreshUser()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelAppointment() {
    if (!cancelingId) {
      return;
    }

    try {
      setSubmitting(true);
      await api.delete(`/appointments/${cancelingId}`);
      toast.success("Agendamento cancelado.");
      setConfirmOpen(false);
      setCancelingId(null);
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading label="Carregando área do cliente" />;
  }

  return (
    <div className="space-y-8 bg-[radial-gradient(circle_at_top_right,rgba(217,4,41,0.12),transparent_26rem)]">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-zinc-400">
                  Área do cliente
                </span>
                <h1 className="mt-4 font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
                  Olá, {user?.name?.split(" ")[0] ?? "cliente"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Seu próximo horário, pontos e benefícios ficam centralizados
                  aqui.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                <div className="rounded-md border border-white/10 bg-club-black p-4">
                  <Trophy className="size-5 text-club-red" aria-hidden="true" />
                  <p className="mt-3 text-xs font-bold uppercase text-zinc-500">
                    Nível
                  </p>
                  <strong className="font-display text-3xl text-white">
                    {user?.level ?? 1}
                  </strong>
                </div>
                <div className="rounded-md border border-white/10 bg-club-black p-4">
                  <Sparkles className="size-5 text-club-red" aria-hidden="true" />
                  <p className="mt-3 text-xs font-bold uppercase text-zinc-500">
                    Pontos
                  </p>
                  <strong className="font-display text-3xl text-white">
                    {currentPoints}
                  </strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-3xl font-semibold uppercase text-white">
                  Clube de pontos
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Nível atual {user?.level ?? 1}
                </p>
              </div>
              <Badge tone="red">{currentPoints} pts</Badge>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-club-black">
              <div
                className="h-full rounded-full bg-gradient-to-r from-club-red to-red-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              {nextReward
                ? `Faltam ${missingPoints} pontos para o próximo prêmio.`
                : "Você já pode resgatar os melhores prêmios disponíveis."}
            </p>
            <Link className="mt-5 inline-flex" to="/premios">
              <Button type="button" variant="secondary">
                Ver prêmios
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section
        className="overflow-hidden rounded-lg border border-white/10 bg-cover bg-center shadow-premium"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(11,11,11,0.92), rgba(11,11,11,0.4)), url(${offerImage})`,
        }}
      >
        <div className="p-6 sm:p-8">
          <Badge tone="red">Oferta Relâmpago</Badge>
          <h2 className="mt-5 max-w-2xl font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
            Corte + barba com experiência premium.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">
            Escolha seu profissional favorito e garanta o próximo horário com
            poucos cliques.
          </p>
          <a className="mt-6 inline-flex" href="#agendamento">
            <Button type="button">
              Agendar
            </Button>
          </a>
        </div>
      </section>

      <section id="agendamento">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-3xl font-semibold uppercase text-white">
                  Agendamento
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Escolha serviço, profissional, data e horário.
                </p>
              </div>
              <Badge tone="zinc">5 etapas</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="rounded-lg border border-white/10 bg-club-black p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold uppercase text-white">
                    Horário de funcionamento
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    A agenda respeita os turnos e bloqueia o intervalo de almoço.
                  </p>
                </div>
                <Badge tone="red">Terça a sábado</Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {OPENING_HOURS.map((item) => (
                  <div
                    className="rounded-md border border-white/10 bg-club-surface p-3"
                    key={item.day}
                  >
                    <p className="text-xs font-bold uppercase text-zinc-500">
                      {item.day}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatOpeningPeriods(item.periods)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle step="1" title="Escolher serviço" />
              <div className="relative mt-4">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
                  aria-hidden="true"
                />
                <input
                  className="h-12 w-full rounded-md border border-white/10 bg-club-black pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-club-red"
                  onChange={(event) => setServiceSearch(event.target.value)}
                  placeholder="Buscar serviço pelo nome"
                  value={serviceSearch}
                />
              </div>

              <div className="pretty-scrollbar mt-4 max-h-[34rem] overflow-y-auto scroll-smooth pr-1 sm:pr-2">
                {filteredServices.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredServices.map((service) => (
                      <article
                        className={cn(
                          "flex h-full flex-col rounded-lg border border-white/10 bg-club-black p-4 text-left transition hover:border-club-red/50",
                          selectedServiceId === service.id &&
                            "border-club-red bg-club-red/10 shadow-[0_0_0_1px_rgba(217,4,41,0.45)]",
                        )}
                        key={service.id}
                      >
                        <Scissors className="size-5 text-club-red" aria-hidden="true" />
                        <h3 className="mt-4 font-display text-2xl font-semibold uppercase text-white">
                          {service.name}
                        </h3>
                        <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">
                          {service.description}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                          <div>
                            <strong className="block font-display text-2xl text-white">
                              {formatCurrency(service.price)}
                            </strong>
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase text-zinc-500">
                              <Clock3 className="size-4 text-club-red" aria-hidden="true" />
                              {getServiceDurationLabel(service)}
                            </span>
                          </div>
                          <Button
                            className="w-full whitespace-nowrap sm:w-auto"
                            onClick={() => setSelectedServiceId(service.id)}
                            size="sm"
                            type="button"
                            variant={selectedServiceId === service.id ? "primary" : "secondary"}
                          >
                            Selecionar
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    description="Nenhum serviço encontrado com esse nome."
                    icon={Scissors}
                    title="Sem serviços"
                  />
                )}
              </div>
            </div>

            <div>
              <SectionTitle step="2" title="Escolher profissional" />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {professionals.map((professional) => (
                  <button
                    className={cn(
                      "overflow-hidden rounded-lg border border-white/10 bg-club-black text-left transition hover:-translate-y-1 hover:border-club-red/50",
                      selectedProfessionalId === professional.id &&
                        "border-club-red bg-club-red/10",
                    )}
                    key={professional.id}
                    onClick={() => setSelectedProfessionalId(professional.id)}
                    type="button"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-club-surface">
                        {professional.user?.avatarUrl ? (
                          <img
                            alt={professional.user.name}
                            className="h-full w-full object-cover"
                            src={professional.user.avatarUrl}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Scissors className="size-6 text-club-red" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-2xl font-semibold uppercase text-white">
                          {professional.user?.name ?? "Profissional"}
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-zinc-500">
                          {professional.specialty}
                        </p>
                        <Badge className="mt-3" tone={professional.online ? "green" : "zinc"}>
                          {professional.online ? "Online" : "Ativo"}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle step="3" title="Escolher data" />
              <div className="mt-4 grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {dateOptions.map((date) => (
                  <button
                    className={cn(
                      "min-h-20 rounded-lg border border-white/10 bg-club-black p-3 text-center text-sm font-bold uppercase text-zinc-400 transition hover:border-club-red/50 hover:text-white",
                      selectedDate === date.value && "border-club-red bg-club-red/10 text-white",
                    )}
                    key={date.value}
                    onClick={() => setSelectedDate(date.value)}
                    type="button"
                  >
                    {date.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle step="4" title="Escolher horário" />
              <div className="mt-4">
                {loadingAvailability ? (
                  <Loading className="min-h-32" label="Buscando horários" />
                ) : availability.length ? (
                  <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {availability.map((slot) => (
                      <button
                        className={cn(
                          "min-h-14 rounded-md border border-white/10 bg-club-black px-3 text-sm font-bold text-zinc-400 transition hover:border-club-red/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-35",
                          selectedSlot?.startTime === slot.startTime &&
                            "border-club-red bg-club-red/10 text-white",
                        )}
                        disabled={!slot.available}
                        key={`${slot.startTime}-${slot.endTime}`}
                        onClick={() => setSelectedSlot(slot)}
                        type="button"
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    description={
                      canLoadAvailability
                        ? "Nenhum horário disponível para esta data."
                        : "Selecione serviço, profissional e data para ver horários disponíveis."
                    }
                    icon={Clock3}
                    title="Horários"
                  />
                )}
              </div>
            </div>

            <div>
              <SectionTitle step="5" title="Confirmar agendamento" />
              <div className="mt-4 grid gap-4 rounded-lg border border-white/10 bg-club-black p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
                  <SummaryItem label="Serviço" value={selectedService?.name ?? "-"} />
                  <SummaryItem
                    label="Profissional"
                    value={selectedProfessional?.user?.name ?? "-"}
                  />
                  <SummaryItem
                    label="Data"
                    value={selectedDate ? formatDate(selectedDate) : "-"}
                  />
                  <SummaryItem label="Horário" value={selectedSlot?.startTime ?? "-"} />
                  <SummaryItem
                    label="Valor"
                    value={selectedService ? formatCurrency(selectedService.price) : "-"}
                  />
                </div>
                <Button
                  disabled={!selectedService || !selectedProfessional || !selectedDate || !selectedSlot}
                  isLoading={submitting}
                  onClick={createAppointment}
                  type="button"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Confirmar agendamento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="ativos"
          icon={CalendarDays}
          label="Próximos"
          value={String(upcomingAppointments.length)}
        />
        <StatCard
          detail="finalizados"
          icon={CheckCircle2}
          label="Histórico"
          value={String(historyAppointments.length)}
        />
        <StatCard
          detail="em benefícios"
          icon={Gift}
          label="Pontos"
          value={String(currentPoints)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Meus agendamentos
            </h2>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentRow
                    appointment={appointment}
                    key={appointment.id}
                    onCancel={() => {
                      setCancelingId(appointment.id);
                      setConfirmOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                description="Seus próximos horários aparecem aqui depois da confirmação."
                icon={CalendarDays}
                title="Sem próximos agendamentos"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Histórico
            </h2>
          </CardHeader>
          <CardContent>
            {historyAppointments.length ? (
              <div className="space-y-3">
                {historyAppointments.map((appointment) => (
                  <div
                    className="rounded-md border border-white/10 bg-club-black p-4"
                    key={appointment.id}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <strong className="font-display text-xl uppercase text-white">
                        {appointment.service?.name ?? "Serviço"}
                      </strong>
                      <Badge tone="green">Finalizado</Badge>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">
                      {formatDate(appointment.date)} às{" "}
                      {getAppointmentTimeValue(appointment.startTime)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                description="Atendimentos finalizados ficam registrados nesta área."
                icon={CheckCircle2}
                title="Sem histórico"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <ConfirmDialog
        confirmLabel="Cancelar agendamento"
        description="Essa ação cancela o horário selecionado. Se precisar, você poderá agendar novamente em outro horário disponível."
        isLoading={submitting}
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setCancelingId(null);
        }}
        onConfirm={cancelAppointment}
        title="Cancelar horário"
      />
    </div>
  );
}

function SectionTitle({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-md bg-club-red font-display text-xl font-semibold text-white">
        {step}
      </span>
      <h3 className="font-display text-2xl font-semibold uppercase text-white">
        {title}
      </h3>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-club-surface p-3">
      <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function AppointmentRow({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel: () => void;
}) {
  const canCancel = appointment.status !== "FINISHED";
  const paymentStatus = appointment.payment?.status ?? "PENDING";
  const canOpenPayment = paymentStatus !== "PAID";

  return (
    <div className="grid gap-4 rounded-md border border-white/10 bg-club-black p-4 transition hover:border-club-red/50 lg:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <strong className="font-display text-2xl font-semibold uppercase text-white">
            {appointment.service?.name ?? "Serviço"}
          </strong>
          <Badge tone={getStatusTone(appointment.status)}>
            {appointmentStatusLabels[appointment.status]}
          </Badge>
          <Badge tone={getPaymentStatusTone(paymentStatus)}>
            {paymentStatusLabels[paymentStatus]}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {formatDate(appointment.date)} às{" "}
          {getAppointmentTimeValue(appointment.startTime)}
          {" - "}
          {appointment.professional?.user?.name ?? "Profissional"}
        </p>
        <p className="mt-2 text-sm font-semibold text-zinc-300">
          {formatCurrency(appointment.totalValue)}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:items-center">
        {canOpenPayment ? (
          <Link to={`/pagamento/${appointment.id}`}>
            <Button size="sm" type="button">
              <WalletCards className="size-4" aria-hidden="true" />
              Pagamento
            </Button>
          </Link>
        ) : null}
        {canCancel ? (
          <Button onClick={onCancel} size="sm" type="button" variant="danger">
            <XCircle className="size-4" aria-hidden="true" />
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  );
}

import { CalendarPlus, Clock3, Plus, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { User } from "../../types/auth";
import type {
  AvailabilityResponse,
  AvailabilitySlot,
  Professional,
  Service,
} from "../../types/domain";
import { getApiErrorMessage } from "../../utils/apiError";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/format";
import { api } from "../../services/api";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

type ClientMode = "existing" | "quick";

export type AppointmentFormSubmitData = {
  clientId?: string;
  date: string;
  endTime: string;
  isExtraSlot: boolean;
  notes: string | null;
  professionalId: string;
  quickClient?: {
    email?: string | null;
    name: string;
    phone: string;
  };
  serviceId: string;
  startTime: string;
  totalValue: string;
};

type AppointmentFormModalProps = {
  clients: User[];
  isLoading: boolean;
  isOpen: boolean;
  lockedProfessionalId?: string;
  onClose: () => void;
  onSubmit: (data: AppointmentFormSubmitData) => Promise<void>;
  professionals: Professional[];
  services: Service[];
  title?: string;
};

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function roundedDuration(service?: Service) {
  const duration = service?.durationMinutes && service.durationMinutes > 0
    ? service.durationMinutes
    : 30;

  return Math.ceil(duration / 30) * 30;
}

function isHalfHourStart(value: string) {
  return timeToMinutes(value) % 30 === 0;
}

export function AppointmentFormModal({
  clients,
  isLoading,
  isOpen,
  lockedProfessionalId,
  onClose,
  onSubmit,
  professionals,
  services,
  title = "Novo agendamento",
}: AppointmentFormModalProps) {
  const todayKey = useMemo(() => toDateInput(new Date()), []);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [date, setDate] = useState(todayKey);
  const [isExtraSlot, setIsExtraSlot] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [notes, setNotes] = useState("");
  const [professionalId, setProfessionalId] = useState(lockedProfessionalId ?? "");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [startTime, setStartTime] = useState("09:30");

  const selectedService = services.find((service) => service.id === serviceId);
  const selectedProfessional = professionals.find(
    (professional) => professional.id === professionalId,
  );
  const clientReady =
    clientMode === "existing"
      ? Boolean(clientId)
      : Boolean(quickName.trim() && quickPhone.trim());
  const canLoadAvailability = Boolean(professionalId && serviceId && date);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setProfessionalId(lockedProfessionalId ?? "");
  }, [isOpen, lockedProfessionalId]);

  useEffect(() => {
    async function loadAvailability() {
      setSelectedSlot(null);
      setAvailability([]);

      if (isExtraSlot || !professionalId || !serviceId || !date) {
        return;
      }

      try {
        setLoadingAvailability(true);
        const { data } = await api.get<AvailabilityResponse>(
          "/appointments/availability",
          {
            params: {
              date,
              professionalId,
              serviceId,
            },
          },
        );
        setAvailability(data.slots.filter((slot) => slot.available));
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoadingAvailability(false);
      }
    }

    loadAvailability();
  }, [date, isExtraSlot, professionalId, serviceId]);

  function closeAndReset() {
    setClientId("");
    setClientMode("existing");
    setDate(todayKey);
    setIsExtraSlot(false);
    setNotes("");
    setProfessionalId(lockedProfessionalId ?? "");
    setQuickEmail("");
    setQuickName("");
    setQuickPhone("");
    setSelectedSlot(null);
    setServiceId("");
    setStartTime("09:30");
    setAvailability([]);
    onClose();
  }

  async function submit() {
    const clientMissing = clientMode === "existing" && !clientId;
    const quickMissing =
      clientMode === "quick" && (!quickName.trim() || !quickPhone.trim());

    if (
      clientMissing ||
      quickMissing ||
      !professionalId ||
      !serviceId ||
      !date ||
      (!isExtraSlot && !selectedSlot) ||
      (isExtraSlot && !startTime)
    ) {
      toast.error("Preencha cliente, serviço, data e horário.");
      return;
    }

    const resolvedStartTime = isExtraSlot ? startTime : selectedSlot?.startTime ?? "";

    if (!isHalfHourStart(resolvedStartTime)) {
      toast.error("O horario deve comecar de 30 em 30 minutos.");
      return;
    }

    const resolvedEndTime = isExtraSlot
      ? minutesToTime(timeToMinutes(resolvedStartTime) + roundedDuration(selectedService))
      : selectedSlot?.endTime ?? "";

    try {
      await onSubmit({
        clientId: clientMode === "existing" ? clientId : undefined,
        date,
        endTime: resolvedEndTime,
        isExtraSlot,
        notes: notes.trim() || null,
        professionalId,
        quickClient:
          clientMode === "quick"
            ? {
                email: quickEmail.trim() || null,
                name: quickName.trim(),
                phone: quickPhone.trim(),
              }
            : undefined,
        serviceId,
        startTime: resolvedStartTime,
        totalValue: selectedService?.price ?? "0",
      });

      closeAndReset();
    } catch {
      // The parent already shows the API error toast.
    }
  }

  return (
    <Modal
      description="Escolha cliente, serviço, data e horário."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={closeAndReset} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button isLoading={isLoading} onClick={submit} type="button">
            {clientMode === "quick" ? (
              <UserPlus className="size-4" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            Criar agendamento
          </Button>
        </div>
      }
      isOpen={isOpen}
      maxWidthClassName="max-w-3xl"
      onClose={closeAndReset}
      title={title}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={cn(
              "min-h-12 rounded-md border border-white/10 bg-club-black px-3 text-sm font-bold text-zinc-400 transition hover:border-club-red/50 hover:text-white",
              clientMode === "existing" && "border-club-red bg-club-red/10 text-white",
            )}
            onClick={() => setClientMode("existing")}
            type="button"
          >
            Cliente cadastrado
          </button>
          <button
            className={cn(
              "min-h-12 rounded-md border border-white/10 bg-club-black px-3 text-sm font-bold text-zinc-400 transition hover:border-club-red/50 hover:text-white",
              clientMode === "quick" && "border-club-red bg-club-red/10 text-white",
            )}
            onClick={() => setClientMode("quick")}
            type="button"
          >
            Cliente rápido
          </button>
        </div>

        {clientMode === "existing" ? (
          <Select
            label="Cliente"
            onChange={(event) => setClientId(event.target.value)}
            value={clientId}
          >
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome"
              onChange={(event) => setQuickName(event.target.value)}
              value={quickName}
            />
            <Input
              label="Telefone"
              onChange={(event) => setQuickPhone(event.target.value)}
              value={quickPhone}
            />
            <Input
              className="sm:col-span-2"
              label="Email opcional"
              onChange={(event) => setQuickEmail(event.target.value)}
              type="email"
              value={quickEmail}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {lockedProfessionalId ? (
            <div className="rounded-md border border-white/10 bg-club-black p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Profissional
              </p>
              <p className="mt-1 font-semibold text-white">
                {selectedProfessional?.user?.name ?? "Profissional"}
              </p>
            </div>
          ) : (
            <Select
              label="Profissional"
              onChange={(event) => setProfessionalId(event.target.value)}
              value={professionalId}
            >
              <option value="">Selecione</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.user?.name ?? "Profissional"}
                </option>
              ))}
            </Select>
          )}

          <Select
            label="Serviço"
            onChange={(event) => setServiceId(event.target.value)}
            value={serviceId}
          >
            <option value="">Selecione</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {formatCurrency(service.price)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Data"
            min={todayKey}
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
          {isExtraSlot ? (
            <Input
              label="Horário"
              onChange={(event) => setStartTime(event.target.value)}
              step={1800}
              type="time"
              value={startTime}
            />
          ) : (
            <div className="rounded-md border border-white/10 bg-club-black p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Horário
              </p>
              <p className="mt-1 font-semibold text-white">
                {selectedSlot
                  ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                  : "Selecione abaixo"}
              </p>
            </div>
          )}
        </div>

        <label className="flex min-h-12 items-center gap-3 rounded-md border border-white/10 bg-club-black px-4 text-sm font-bold text-zinc-300">
          <input
            checked={isExtraSlot}
            className="size-4 accent-club-red"
            onChange={(event) => setIsExtraSlot(event.target.checked)}
            type="checkbox"
          />
          Marcar como encaixe
        </label>

        {isExtraSlot ? (
          <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-4 text-sm font-semibold leading-6 text-amber-100">
            Este é um encaixe e pode gerar sobreposição na agenda.
          </div>
        ) : (
          <div>
            {loadingAvailability ? (
              <div className="rounded-md border border-white/10 bg-club-black p-5">
                <Clock3 className="mx-auto size-6 animate-pulse text-club-red" />
              </div>
            ) : availability.length ? (
              <div className="grid max-h-48 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {availability.map((slot) => (
                  <button
                    className={cn(
                      "min-h-11 rounded-md border border-white/10 bg-club-black text-sm font-bold text-zinc-400 transition hover:border-club-red/50 hover:text-white",
                      selectedSlot?.startTime === slot.startTime &&
                        "border-club-red bg-club-red/10 text-white",
                    )}
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
                  clientReady && canLoadAvailability
                    ? "Nenhum horário disponível para esta data."
                    : "Escolha cliente, profissional, serviço e data para ver horários."
                }
                icon={CalendarPlus}
                title="Horários"
              />
            )}
          </div>
        )}

        <Textarea
          label="Observação opcional"
          onChange={(event) => setNotes(event.target.value)}
          value={notes}
        />

      </div>
    </Modal>
  );
}

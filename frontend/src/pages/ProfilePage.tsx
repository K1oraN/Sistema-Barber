import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Edit3,
  Gift,
  Save,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { StatCard } from "../components/ui/StatCard";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { Appointment, ClientPlan, RewardRedemption } from "../types/domain";
import { getApiErrorMessage } from "../utils/apiError";
import { maskPhone } from "../utils/phoneMask";
import {
  clientPlanStatusLabels,
  getClientPlanStatusTone,
} from "../utils/status";
import { formatDate } from "../utils/format";
import {
  profileSchema,
  type ProfileFormData,
} from "../validations/profileValidation";

export function ProfilePage() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentPlan, setCurrentPlan] = useState<ClientPlan | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const {
    formState: { dirtyFields, errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormData>({
    mode: "onTouched",
    resolver: zodResolver(profileSchema),
    defaultValues: {
      avatarUrl: user?.avatarUrl ?? "",
      birthDate: user?.birthDate?.slice(0, 10) ?? "",
      confirmNewPassword: "",
      currentPassword: "",
      name: user?.name ?? "",
      newPassword: "",
      phone: user?.phone ?? "",
    },
  });
  const phoneField = register("phone");

  useEffect(() => {
    if (user) {
      reset({
        avatarUrl: user.avatarUrl ?? "",
        birthDate: user.birthDate?.slice(0, 10) ?? "",
        confirmNewPassword: "",
        currentPassword: "",
        name: user.name,
        newPassword: "",
        phone: user.phone,
      });
    }
  }, [reset, user]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [appointmentsResponse, redemptionsResponse, currentPlanResponse] = await Promise.all([
          api.get<Appointment[]>("/appointments"),
          api.get<RewardRedemption[]>("/reward-redemptions"),
          api.get<ClientPlan | null>("/plans/subscriptions/me"),
        ]);
        setAppointments(appointmentsResponse.data);
        setRedemptions(redemptionsResponse.data);
        setCurrentPlan(currentPlanResponse.data);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  async function onSubmit(data: ProfileFormData) {
    if (!user) {
      return;
    }

    try {
      await api.put(`/users/${user.id}`, {
        avatarUrl: data.avatarUrl || null,
        birthDate: data.birthDate || null,
        currentPassword: data.currentPassword || undefined,
        name: data.name,
        password: data.newPassword || undefined,
        phone: data.phone,
      });
      await refreshUser();
      setEditing(false);
      toast.success("Perfil atualizado.");
      reset({
        avatarUrl: data.avatarUrl ?? "",
        birthDate: data.birthDate ?? "",
        confirmNewPassword: "",
        currentPassword: "",
        name: data.name,
        newPassword: "",
        phone: data.phone,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (loading) {
    return <Loading label="Carregando perfil" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/cliente")} size="sm" type="button" variant="secondary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </Button>
          <div>
            <h1 className="font-display text-4xl font-semibold uppercase text-white">
              Perfil
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Dados pessoais, senha e estatísticas da sua conta.
            </p>
          </div>
        </div>
        <Button onClick={() => setEditing(true)} type="button" variant="secondary">
          <Edit3 className="size-4" aria-hidden="true" />
          Editar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card>
          <CardContent>
            <div className="mx-auto size-28 overflow-hidden rounded-full border border-white/10 bg-club-black">
              {user?.avatarUrl ? (
                <img
                  alt={user.name}
                  className="h-full w-full object-cover"
                  src={user.avatarUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-club-red">
                  <UserRound className="size-12" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="mt-5 text-center">
              <h2 className="font-display text-3xl font-semibold uppercase text-white">
                {user?.name}
              </h2>
              <p className="mt-2 text-sm text-zinc-500">{user?.email}</p>
              <div className="mt-5 flex justify-center gap-2">
                <Badge tone="red">Nível {user?.level ?? 1}</Badge>
                <Badge tone="zinc">{user?.points ?? 0} pontos</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            detail="registrados"
            icon={CalendarDays}
            label="Agendamentos"
            value={String(appointments.length)}
          />
          <StatCard
            detail="disponíveis"
            icon={Sparkles}
            label="Pontos"
            value={String(user?.points ?? 0)}
          />
          <StatCard
            detail="solicitados"
            icon={Gift}
            label="Prêmios"
            value={String(redemptions.length)}
          />
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-3xl font-semibold uppercase text-white">
                  Plano atual
                </h2>
                <Badge tone={currentPlan ? getClientPlanStatusTone(currentPlan.status) : "zinc"}>
                  {currentPlan ? clientPlanStatusLabels[currentPlan.status] : "Sem plano"}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {currentPlan?.plan?.name ?? "Voce ainda nao possui plano ativo."}
                {currentPlan?.endDate ? ` Vence em ${formatDate(currentPlan.endDate)}.` : ""}
              </p>
            </div>
            <Button onClick={() => navigate("/planos")} type="button" variant="secondary">
              <CreditCard className="size-4" aria-hidden="true" />
              Ver planos
            </Button>
          </div>

          {currentPlan?.plan?.benefits?.length ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {currentPlan.plan.benefits.map((benefit) => (
                <span
                  className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-club-black px-3 text-sm font-semibold text-zinc-300"
                  key={benefit}
                >
                  <CreditCard className="size-4 shrink-0 text-club-red" aria-hidden="true" />
                  {benefit}
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <Input
              disabled={!editing}
              error={errors.name?.message}
              label="Nome"
              success={Boolean(dirtyFields.name && !errors.name)}
              {...register("name")}
            />
            <Input
              disabled={!editing}
              error={errors.phone?.message}
              label="Telefone"
              success={Boolean(dirtyFields.phone && !errors.phone)}
              {...phoneField}
              onChange={(event) => {
                event.target.value = maskPhone(event.target.value);
                phoneField.onChange(event);
              }}
            />
            <Input
              disabled={!editing}
              error={errors.avatarUrl?.message}
              label="Foto / avatarUrl"
              success={Boolean(dirtyFields.avatarUrl && !errors.avatarUrl)}
              {...register("avatarUrl")}
            />
            <Input
              disabled={!editing}
              error={errors.birthDate?.message}
              label="Data de nascimento"
              success={Boolean(dirtyFields.birthDate && !errors.birthDate)}
              type="date"
              {...register("birthDate")}
            />
            <Input
              disabled={!editing}
              error={errors.currentPassword?.message}
              label="Senha atual"
              type="password"
              {...register("currentPassword")}
            />
            <Input
              disabled={!editing}
              error={errors.newPassword?.message}
              label="Nova senha"
              type="password"
              {...register("newPassword")}
            />
            <Input
              disabled={!editing}
              error={errors.confirmNewPassword?.message}
              label="Confirmar nova senha"
              type="password"
              {...register("confirmNewPassword")}
            />

            <div className="lg:col-span-2">
              <Button
                disabled={!editing}
                isLoading={isSubmitting}
                type="submit"
              >
                <Save className="size-4" aria-hidden="true" />
                Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

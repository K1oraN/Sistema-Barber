import { zodResolver } from "@hookform/resolvers/zod";
import {
  Ban,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ClipboardCopy,
  CreditCard,
  DollarSign,
  Edit3,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Plus,
  Scissors,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  UserPlus,
  UsersRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useForm,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { StatCard } from "../components/ui/StatCard";
import { Textarea } from "../components/ui/Textarea";
import {
  AppointmentFormModal,
  type AppointmentFormSubmitData,
} from "../components/appointments/AppointmentFormModal";
import { CancelAppointmentModal } from "../components/appointments/CancelAppointmentModal";
import { PaymentConfirmationModal } from "../components/appointments/PaymentConfirmationModal";
import { useAuth } from "../hooks/useAuth";
import { getServiceDurationLabel } from "../constants/barbershop";
import { api } from "../services/api";
import type { User } from "../types/auth";
import type {
  Appointment,
  ClientPlan,
  Payment,
  Plan,
  Product,
  ProductOrder,
  Professional,
  Reward,
  Service,
} from "../types/domain";
import { getApiErrorMessage } from "../utils/apiError";
import { cn } from "../utils/cn";
import { formatCurrency, formatTime } from "../utils/format";
import { maskPhone } from "../utils/phoneMask";
import { getRoleLabel } from "../utils/roleRedirect";
import {
  createTeamAdminSchema,
  editTeamAdminSchema,
  planAdminSchema,
  productAdminSchema,
  rewardAdminSchema,
  serviceAdminSchema,
} from "../validations/adminValidation";

type AdminSection =
  | "dashboard"
  | "agenda"
  | "financeiro"
  | "servicos"
  | "produtos"
  | "pedidos"
  | "planos"
  | "premios"
  | "relatorios"
  | "marketing"
  | "equipe";

type CatalogKind = "service" | "product" | "plan" | "reward";
type AppointmentAction = "confirm" | "finish" | "delete";

type CatalogModalState =
  | {
      item?: Plan | Product | Reward | Service;
      kind: CatalogKind;
      mode: "create" | "edit";
    }
  | null;

type ConfirmState =
  | {
      action: () => Promise<void>;
      confirmLabel: string;
      description: string;
      title: string;
    }
  | null;

type TeamModalState =
  | {
      mode: "create" | "edit";
      professional?: Professional;
    }
  | null;

type CatalogForm = {
  active: boolean;
  allowPreOrder: boolean;
  benefits: string;
  category: string;
  costPrice: string;
  description: string;
  discountValue: string;
  durationLabel: string;
  durationMinutes: string;
  highlighted: boolean;
  imageUrl: string;
  name: string;
  productId: string;
  price: string;
  requiredPoints: string;
  rewardType: Reward["rewardType"];
  serviceId: string;
  stock: string;
};

type TeamForm = {
  active: boolean;
  birthDate: string;
  commissionPercent: string;
  email: string;
  name: string;
  online: boolean;
  password: string;
  phone: string;
  specialty: string;
};

type AgendaFilters = {
  client: string;
  date: string;
  professionalId: string;
  status: string;
};

type FinanceFilters = {
  endDate: string;
  startDate: string;
};

type ProductOrderFilters = {
  client: string;
  date: string;
  product: string;
  status: string;
  type: string;
};

const sectionGroups: Array<{
  items: Array<{ id: AdminSection; icon: LucideIcon; label: string }>;
  title: string;
}> = [
  {
    title: "Gestao",
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { id: "relatorios", icon: BarChart3, label: "Relatorios" },
      { id: "agenda", icon: CalendarDays, label: "Agenda" },
      { id: "financeiro", icon: WalletCards, label: "Financeiro" },
      { id: "equipe", icon: UsersRound, label: "Equipe" },
    ],
  },
  {
    title: "Catalogo",
    items: [
      { id: "servicos", icon: Scissors, label: "Servicos" },
      { id: "planos", icon: CreditCard, label: "Planos" },
      { id: "produtos", icon: Package, label: "Produtos" },
      { id: "pedidos", icon: ClipboardList, label: "Pedidos" },
      { id: "premios", icon: Gift, label: "Premios" },
    ],
  },
  {
    title: "CRM",
    items: [
      { id: "marketing", icon: Sparkles, label: "Marketing" },
    ],
  },
];

const sectionTitles: Record<AdminSection, string> = {
  agenda: "Agenda",
  dashboard: "Dashboard",
  equipe: "Equipe",
  financeiro: "Financeiro",
  marketing: "Marketing",
  pedidos: "Pedidos",
  planos: "Planos",
  premios: "Premios",
  relatorios: "Relatorios",
  produtos: "Produtos",
  servicos: "Servicos",
};

const statusLabels: Record<Appointment["status"], string> = {
  CANCELED: "Cancelado",
  CONFIRMED: "Confirmado",
  FINISHED: "Finalizado",
  SCHEDULED: "Agendado",
};

const paymentMethodLabels: Record<Payment["method"], string> = {
  CARD: "Cartão Infinity Pay",
  CASH: "Dinheiro",
  PIX: "Pix",
};

const paymentStatusLabels: Record<Payment["status"], string> = {
  AWAITING_CONFIRMATION: "Aguardando confirmação",
  CANCELED: "Cancelado",
  PAID: "Pago",
  PENDING: "Pendente",
};

const clientPlanStatusLabels: Record<ClientPlan["status"], string> = {
  ACTIVE: "Ativo",
  CANCELED: "Cancelado",
  EXPIRED: "Vencido",
  PENDING: "Aguardando confirmacao",
};

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

const emptyCatalogForm: CatalogForm = {
  active: true,
  allowPreOrder: false,
  benefits: "",
  category: "Geral",
  costPrice: "",
  description: "",
  discountValue: "",
  durationLabel: "",
  durationMinutes: "",
  highlighted: false,
  imageUrl: "",
  name: "",
  productId: "",
  price: "",
  requiredPoints: "",
  rewardType: "SERVICE",
  serviceId: "",
  stock: "",
};

const emptyTeamForm: TeamForm = {
  active: true,
  birthDate: "",
  commissionPercent: "40.00",
  email: "",
  name: "",
  online: false,
  password: "",
  phone: "",
  specialty: "",
};

function adminSectionFromParam(section?: string): AdminSection {
  const routeMap: Record<string, AdminSection> = {
    agenda: "agenda",
    dashboard: "dashboard",
    equipe: "equipe",
    estoque: "produtos",
    financeiro: "financeiro",
    marketing: "marketing",
    pedidos: "pedidos",
    planos: "planos",
    premios: "premios",
    produtos: "produtos",
    relatorios: "relatorios",
    servicos: "servicos",
  };

  return section ? routeMap[section] ?? "dashboard" : "dashboard";
}

function adminSectionPath(section: AdminSection) {
  return section === "dashboard" ? "/admin" : `/admin/${section}`;
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function localDateFromKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function dateKey(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatLocalDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(localDateFromKey(dateKey(value)));
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  }).format(localDateFromKey(dateKey(value)));
}

function appointmentDateKey(appointment: Appointment) {
  return dateKey(appointment.date);
}

function timeValue(value: string) {
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : formatTime(value);
}

function appointmentStartDate(appointment: Appointment) {
  return new Date(
    `${appointmentDateKey(appointment)}T${timeValue(appointment.startTime)}:00`,
  );
}

function startOfWeek(reference: Date) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function isSameWeek(date: Date, reference: Date) {
  const start = startOfWeek(reference);
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

function getPaymentTone(status: Payment["status"]) {
  if (status === "PENDING") {
    return "amber";
  }

  if (status === "AWAITING_CONFIRMATION") {
    return "blue";
  }

  if (status === "CANCELED") {
    return "red";
  }

  return "green";
}

function getClientPlanTone(status: ClientPlan["status"]) {
  if (status === "PENDING") {
    return "blue";
  }

  if (status === "EXPIRED" || status === "CANCELED") {
    return "red";
  }

  return "green";
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

function paymentDate(payment: Payment) {
  return new Date(payment.createdAt);
}

function paidPayments(payments: Payment[]) {
  return payments.filter((payment) => payment.status === "PAID");
}

function sumPayments(payments: Payment[], predicate: (payment: Payment) => boolean) {
  return paidPayments(payments)
    .filter(predicate)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
}

function sanitizePhone(phone?: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

function whatsappUrl(phone: string | undefined, message: string) {
  const digits = sanitizePhone(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function birthdayMessage(name: string) {
  return `Ola, ${name}! O Club do Rafa deseja um feliz aniversario! Temos uma condicao especial para voce comemorar no estilo.`;
}

function inactiveMessage(name: string) {
  return `Ola, ${name}! Sentimos sua falta no Club do Rafa. Que tal agendar seu proximo corte?`;
}

export function AdminDashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState<AdminSection>(() =>
    adminSectionFromParam(section),
  );
  const [agendaFilters, setAgendaFilters] = useState<AgendaFilters>({
    client: "",
    date: "",
    professionalId: "",
    status: "",
  });
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancelingAppointment, setCancelingAppointment] =
    useState<Appointment | null>(null);
  const [catalogForm, setCatalogForm] = useState<CatalogForm>(emptyCatalogForm);
  const [catalogModal, setCatalogModal] = useState<CatalogModalState>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmingPaymentAppointment, setConfirmingPaymentAppointment] =
    useState<Appointment | null>(null);
  const [financeFilters, setFinanceFilters] = useState<FinanceFilters>({
    endDate: "",
    startDate: "",
  });
  const [finishConfirmAppointment, setFinishConfirmAppointment] =
    useState<Appointment | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [planSubscriptions, setPlanSubscriptions] = useState<ClientPlan[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [productOrderFilters, setProductOrderFilters] = useState<ProductOrderFilters>({
    client: "",
    date: "",
    product: "",
    status: "",
    type: "",
  });
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [teamForm, setTeamForm] = useState<TeamForm>(emptyTeamForm);
  const [teamModal, setTeamModal] = useState<TeamModalState>(null);
  const [users, setUsers] = useState<User[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const [
        usersResponse,
        servicesResponse,
        productsResponse,
        plansResponse,
        rewardsResponse,
        professionalsResponse,
        appointmentsResponse,
        paymentsResponse,
        productOrdersResponse,
        planSubscriptionsResponse,
      ] = await Promise.all([
        api.get<User[]>("/users"),
        api.get<Service[]>("/services"),
        api.get<Product[]>("/products"),
        api.get<Plan[]>("/plans"),
        api.get<Reward[]>("/rewards"),
        api.get<Professional[]>("/professionals"),
        api.get<Appointment[]>("/appointments"),
        api.get<Payment[]>("/payments"),
        api.get<ProductOrder[]>("/product-orders"),
        api.get<ClientPlan[]>("/plans/subscriptions"),
      ]);

      setUsers(usersResponse.data);
      setServices(servicesResponse.data);
      setProducts(productsResponse.data);
      setPlans(plansResponse.data);
      setRewards(rewardsResponse.data);
      setProfessionals(professionalsResponse.data);
      setAppointments(appointmentsResponse.data);
      setPayments(paymentsResponse.data);
      setProductOrders(productOrdersResponse.data);
      setPlanSubscriptions(planSubscriptionsResponse.data);
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
    setActiveSection(adminSectionFromParam(section));
  }, [section]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function selectSection(section: AdminSection) {
    setActiveSection(section);
    setIsMobileSidebarOpen(false);
    navigate(adminSectionPath(section));
  }

  function openCatalogModal(kind: CatalogKind, item?: Plan | Product | Reward | Service) {
    setCatalogForm(toCatalogForm(kind, item));
    setCatalogModal({ item, kind, mode: item ? "edit" : "create" });
  }

  async function saveCatalogItem(data: CatalogForm) {
    if (!catalogModal || saving) {
      return;
    }

    try {
      setSaving(true);
      const { endpoint, payload } = catalogPayload(catalogModal.kind, data);

      if (catalogModal.mode === "edit" && catalogModal.item) {
        await api.put(`${endpoint}/${catalogModal.item.id}`, payload);
        toast.success("Cadastro atualizado.");
      } else {
        await api.post(endpoint, payload);
        toast.success("Cadastro criado.");
      }

      setCatalogModal(null);
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function confirmDeactivateCatalog(kind: CatalogKind, item: Plan | Product | Reward | Service) {
    const endpoint = catalogEndpoint(kind);

    setConfirmState({
      confirmLabel: "Desativar",
      description: `Voce esta desativando "${item.name}". Ele deixa de aparecer como ativo no sistema.`,
      title: "Desativar cadastro",
      action: async () => {
        await api.delete(`${endpoint}/${item.id}`);
        toast.success("Cadastro desativado.");
        await loadDashboard();
      },
    });
  }

  async function activateCatalog(kind: CatalogKind, item: Plan | Product | Reward | Service) {
    try {
      setRunningAction(`activate:${kind}:${item.id}`);
      await api.put(`${catalogEndpoint(kind)}/${item.id}`, { active: true });
      toast.success("Cadastro ativado.");
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function runPlanSubscriptionAction(
    subscription: ClientPlan,
    action: "approve" | "cancel" | "renew",
  ) {
    const labels = {
      approve: "Plano aprovado.",
      cancel: "Plano cancelado.",
      renew: "Plano renovado.",
    };

    try {
      setRunningAction(`plan:${action}:${subscription.id}`);
      await api.post(`/plans/subscriptions/${subscription.id}/${action}`);
      toast.success(labels[action]);
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function updatePlanSubscriptionLink(subscription: ClientPlan, infinityPayUrl: string) {
    try {
      setRunningAction(`plan:link:${subscription.id}`);
      await api.put(`/plans/subscriptions/${subscription.id}/payment-link`, {
        infinityPayUrl: infinityPayUrl || null,
      });
      toast.success("Link Infinity Pay atualizado.");
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function updateProductOrder(
    order: ProductOrder,
    data: Partial<Pick<ProductOrder, "paymentMethod" | "paymentStatus" | "status">>,
  ) {
    try {
      setRunningAction(`order:${order.id}`);
      await api.put(`/product-orders/${order.id}`, data);
      toast.success("Pedido atualizado.");
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function updateProductOrderPaymentLink(order: ProductOrder, infinityPayUrl: string) {
    try {
      setRunningAction(`order:link:${order.id}`);
      await api.put(`/product-orders/${order.id}/payment-link`, {
        infinityPayUrl: infinityPayUrl || null,
      });
      toast.success("Link Infinity Pay atualizado.");
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunningAction(null);
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
      toast.success("Atendimento finalizado.");
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

    if (action === "delete") {
      setConfirmState({
        confirmLabel: "Excluir",
        description: "Este agendamento sera removido da base. Use apenas quando necessario.",
        title: "Excluir agendamento",
        action: async () => {
          await api.delete(`/appointments/${appointment.id}`);
          toast.success("Agendamento excluido.");
          await loadDashboard();
        },
      });
      return;
    }

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

  function openTeamModal(professional?: Professional) {
    setTeamForm(toTeamForm(professional));
    setTeamModal({
      mode: professional ? "edit" : "create",
      professional,
    });
  }

  async function saveTeamMember(data: TeamForm) {
    if (!teamModal || saving) {
      return;
    }

    try {
      setSaving(true);

      if (teamModal.mode === "create") {
        const { data: createdUser } = await api.post<User>("/users", {
          active: data.active,
          birthDate: data.birthDate || null,
          email: data.email,
          name: data.name,
          password: data.password,
          phone: data.phone,
          role: "PROFESSIONAL",
        });

        await api.post("/professionals", {
          active: data.active,
          commissionPercent: data.commissionPercent,
          online: data.online,
          specialty: data.specialty,
          userId: createdUser.id,
        });

        toast.success("Profissional criado.");
      } else if (teamModal.professional) {
        const userPayload: Record<string, string | boolean | null> = {
          active: data.active,
          birthDate: data.birthDate || null,
          email: data.email,
          name: data.name,
          phone: data.phone,
        };

        if (data.password) {
          userPayload.password = data.password;
        }

        await Promise.all([
          api.put(`/users/${teamModal.professional.userId}`, userPayload),
          api.put(`/professionals/${teamModal.professional.id}`, {
            active: data.active,
            commissionPercent: data.commissionPercent,
            online: data.online,
            specialty: data.specialty,
          }),
        ]);

        toast.success("Profissional atualizado.");
      }

      setTeamModal(null);
      await loadDashboard();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function confirmToggleProfessional(professional: Professional, active: boolean) {
    setConfirmState({
      confirmLabel: active ? "Ativar" : "Desativar",
      description: active
        ? `Voce esta ativando ${professional.user?.name ?? "este profissional"}.`
        : `Voce esta desativando ${professional.user?.name ?? "este profissional"}.`,
      title: active ? "Ativar profissional" : "Desativar profissional",
      action: async () => {
        await Promise.all([
          api.put(`/professionals/${professional.id}`, { active }),
          api.put(`/users/${professional.userId}`, { active }),
        ]);
        toast.success(active ? "Profissional ativado." : "Profissional desativado.");
        await loadDashboard();
      },
    });
  }

  function openProfessionalAgenda(professional: Professional) {
    setAgendaFilters({
      client: "",
      date: "",
      professionalId: professional.id,
      status: "",
    });
    selectSection("agenda");
  }

  async function confirmAction() {
    if (!confirmState) {
      return;
    }

    try {
      setSaving(true);
      await confirmState.action();
      setConfirmState(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function copyMarketingMessage(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensagem copiada.");
    } catch {
      toast.error("Nao foi possivel copiar a mensagem.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-club-black text-white">
        <Loading label="Carregando painel admin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-club-black text-white">
      <AdminSidebar
        activeSection={activeSection}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onLogout={handleLogout}
        onSelect={selectSection}
      />

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-club-black/90 backdrop-blur">
          <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                aria-label="Abrir menu"
                className="lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
                size="sm"
                type="button"
                variant="secondary"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-club-red">
                  ADMIN PANEL
                </p>
                <h1 className="truncate font-display text-2xl font-semibold uppercase text-white sm:text-5xl">
                  {sectionTitles[activeSection]}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 sm:flex">
              <Shield className="size-4 text-club-red" aria-hidden="true" />
              <span className="max-w-44 truncate text-sm font-bold text-zinc-200">
                {user ? getRoleLabel(user.role) : "Administrador"}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl min-w-0 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          {activeSection === "dashboard" ? (
            <DashboardSection
              appointments={appointments}
              payments={payments}
              planSubscriptions={planSubscriptions}
              productOrders={productOrders}
              products={products}
              professionals={professionals}
              users={users}
            />
          ) : null}

          {activeSection === "relatorios" ? (
            <ReportsSection
              appointments={appointments}
              payments={payments}
              planSubscriptions={planSubscriptions}
              productOrders={productOrders}
              professionals={professionals}
              services={services}
              users={users}
            />
          ) : null}

          {activeSection === "agenda" ? (
            <AgendaSection
              appointments={appointments}
              filters={agendaFilters}
              onAction={runAppointmentAction}
              onCancel={setCancelingAppointment}
              onFiltersChange={setAgendaFilters}
              onConfirmPayment={setConfirmingPaymentAppointment}
              onNewAppointment={() => setAppointmentModalOpen(true)}
              professionals={professionals}
              runningAction={runningAction}
            />
          ) : null}

          {activeSection === "financeiro" ? (
            <FinanceSection
              filters={financeFilters}
              onFiltersChange={setFinanceFilters}
              payments={payments}
            />
          ) : null}

          {activeSection === "servicos" ? (
            <CatalogSection
              description="Servicos vendidos na agenda do Club do Rafa."
              items={services}
              kind="service"
              onActivate={activateCatalog}
              onDeactivate={confirmDeactivateCatalog}
              onEdit={openCatalogModal}
              onNew={openCatalogModal}
              runningAction={runningAction}
              title="Servicos"
            />
          ) : null}

          {activeSection === "produtos" ? (
            <CatalogSection
              description="Produtos, estoque, reservas e encomendas."
              items={products}
              kind="product"
              onActivate={activateCatalog}
              onDeactivate={confirmDeactivateCatalog}
              onEdit={openCatalogModal}
              onNew={openCatalogModal}
              runningAction={runningAction}
              title="Produtos"
            />
          ) : null}

          {activeSection === "planos" ? (
            <div className="space-y-6">
              <CatalogSection
                description="Planos e beneficios recorrentes."
                items={plans}
                kind="plan"
                onActivate={activateCatalog}
                onDeactivate={confirmDeactivateCatalog}
                onEdit={openCatalogModal}
                onNew={openCatalogModal}
                runningAction={runningAction}
                title="Planos"
              />
              <PlanSubscriptionsSection
                onAction={runPlanSubscriptionAction}
                onPaymentLink={updatePlanSubscriptionLink}
                runningAction={runningAction}
                subscriptions={planSubscriptions}
              />
            </div>
          ) : null}

          {activeSection === "pedidos" ? (
            <ProductOrdersSection
              filters={productOrderFilters}
              onFiltersChange={setProductOrderFilters}
              onPaymentLink={updateProductOrderPaymentLink}
              onUpdate={updateProductOrder}
              orders={productOrders}
              runningAction={runningAction}
            />
          ) : null}

          {activeSection === "premios" ? (
            <CatalogSection
              description="Premios liberados pelo clube de pontos."
              items={rewards}
              kind="reward"
              onActivate={activateCatalog}
              onDeactivate={confirmDeactivateCatalog}
              onEdit={openCatalogModal}
              onNew={openCatalogModal}
              runningAction={runningAction}
              title="Premios"
            />
          ) : null}

          {activeSection === "marketing" ? (
            <MarketingSection
              appointments={appointments}
              onCopy={copyMarketingMessage}
              users={users}
            />
          ) : null}

          {activeSection === "equipe" ? (
            <TeamSection
              onEdit={openTeamModal}
              onNew={() => openTeamModal()}
              onOpenAgenda={openProfessionalAgenda}
              onToggleActive={confirmToggleProfessional}
              professionals={professionals}
            />
          ) : null}
        </main>
      </div>

      <CatalogModal
        form={catalogForm}
        isLoading={saving}
        modal={catalogModal}
        onClose={() => setCatalogModal(null)}
        onSave={saveCatalogItem}
        products={products}
        services={services}
      />

      <TeamModal
        form={teamForm}
        isLoading={saving}
        modal={teamModal}
        onClose={() => setTeamModal(null)}
        onSave={saveTeamMember}
      />

      <AppointmentFormModal
        clients={users.filter((item) => item.role === "CLIENT" && item.active)}
        isLoading={runningAction === "create-appointment"}
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        onSubmit={createAppointment}
        professionals={professionals.filter((professional) => professional.active)}
        services={services.filter((service) => service.active)}
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

      <ConfirmDialog
        confirmLabel={confirmState?.confirmLabel}
        description={confirmState?.description ?? ""}
        isLoading={saving}
        isOpen={Boolean(confirmState)}
        onClose={() => setConfirmState(null)}
        onConfirm={confirmAction}
        title={confirmState?.title ?? "Confirmar acao"}
      />
    </div>
  );
}

function AdminSidebar({
  activeSection,
  isMobileOpen,
  onClose,
  onLogout,
  onSelect,
}: {
  activeSection: AdminSection;
  isMobileOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSelect: (section: AdminSection) => void;
}) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-club-black/95 px-5 py-6 lg:flex lg:flex-col">
        <SidebarContent
          activeSection={activeSection}
          onLogout={onLogout}
          onSelect={onSelect}
        />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
            type="button"
          />
          <aside className="relative flex h-full w-80 max-w-[86vw] flex-col border-r border-white/10 bg-club-black px-5 py-6 shadow-premium">
            <div className="absolute right-4 top-4">
              <Button aria-label="Fechar menu" onClick={onClose} size="sm" type="button" variant="ghost">
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>
            <SidebarContent
              activeSection={activeSection}
              onLogout={onLogout}
              onSelect={onSelect}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarContent({
  activeSection,
  onLogout,
  onSelect,
}: {
  activeSection: AdminSection;
  onLogout: () => void;
  onSelect: (section: AdminSection) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3">
        <img alt="Club do Rafa" className="size-12 rounded-lg border border-white/10 bg-club-surface" src="/logo-icon.svg" />
        <div>
          <p className="font-display text-2xl font-semibold uppercase leading-none text-white">
            ADMIN
          </p>
          <p className="font-display text-2xl font-semibold uppercase leading-none text-club-red">
            PANEL
          </p>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-7 overflow-y-auto pr-1">
        {sectionGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-xs font-bold uppercase text-zinc-600">
              {group.title}
            </p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => (
                <button
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white",
                    activeSection === item.id &&
                      "bg-club-red text-white hover:bg-club-red",
                  )}
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  type="button"
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-5">
        <Button className="w-full" onClick={onLogout} type="button" variant="secondary">
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </Button>
      </div>
    </div>
  );
}

function DashboardSection({
  appointments,
  payments,
  planSubscriptions,
  productOrders,
  products,
  professionals,
  users,
}: {
  appointments: Appointment[];
  payments: Payment[];
  planSubscriptions: ClientPlan[];
  productOrders: ProductOrder[];
  products: Product[];
  professionals: Professional[];
  users: User[];
}) {
  const [period, setPeriod] = useState("month");
  const [customRange, setCustomRange] = useState({
    endDate: toDateInput(new Date()),
    startDate: toDateInput(new Date()),
  });
  const { endDate, startDate } = resolveDashboardRange(period, customRange);
  const filteredAppointments = appointments.filter((appointment) =>
    isDateKeyBetween(appointmentDateKey(appointment), startDate, endDate),
  );
  const filteredPayments = payments.filter((payment) =>
    isDateKeyBetween(dateKey(payment.createdAt), startDate, endDate),
  );
  const filteredOrders = productOrders.filter((order) =>
    isDateKeyBetween(dateKey(order.createdAt), startDate, endDate),
  );
  const filteredPlans = planSubscriptions.filter((subscription) =>
    isDateKeyBetween(dateKey(subscription.createdAt), startDate, endDate),
  );
  const todayKey = toDateInput(new Date());
  const todayAppointments = appointments.filter((appointment) => appointmentDateKey(appointment) === todayKey);
  const paidRevenue = sumPayments(filteredPayments, (payment) => payment.status === "PAID");
  const pendingRevenue = filteredPayments
    .filter((payment) => payment.status === "PENDING" || payment.status === "AWAITING_CONFIRMATION")
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const clients = users.filter((item) => item.role === "CLIENT");
  const newClients = clients.filter((client) =>
    isDateKeyBetween(dateKey(client.createdAt), startDate, endDate),
  );
  const activeProfessionals = professionals.filter((item) => item.active);
  const activePlans = planSubscriptions.filter((subscription) => subscription.status === "ACTIVE");
  const pendingPlans = planSubscriptions.filter((subscription) => subscription.status === "PENDING");
  const pendingOrders = productOrders.filter((order) =>
    ["PRE_ORDER_REQUESTED", "UNDER_REVIEW", "ORDERED", "AVAILABLE_FOR_PICKUP"].includes(order.status),
  );
  const lowStockProducts = products.filter((product) => product.active && product.stock <= 3);
  const canceledAppointments = filteredAppointments.filter((appointment) => appointment.status === "CANCELED");
  const occupied = filteredAppointments.filter((appointment) => appointment.status !== "CANCELED").length;
  const capacity = Math.max(activeProfessionals.length * Math.max(daysInRange(startDate, endDate), 1) * 18, 1);
  const occupancyRate = Math.round((occupied / capacity) * 100);
  const cancellationRate = filteredAppointments.length
    ? Math.round((canceledAppointments.length / filteredAppointments.length) * 100)
    : 0;
  const ticketAverage = filteredPayments.filter((payment) => payment.status === "PAID").length
    ? paidRevenue / filteredPayments.filter((payment) => payment.status === "PAID").length
    : 0;
  const revenueByDay = buildRevenueByDayForRange(filteredPayments, startDate, endDate);
  const appointmentsByDay = buildAppointmentsByDayForRange(filteredAppointments, startDate, endDate);
  const appointmentsByStatus = buildPieData(
    filteredAppointments,
    (appointment) => statusLabels[appointment.status],
  );
  const paymentsByMethod = buildPieData(
    filteredPayments,
    (payment) => paymentMethodLabels[payment.method],
  );
  const todayRevenue = sumPayments(
    payments,
    (payment) => dateKey(payment.createdAt) === todayKey,
  );
  const servicesRank = rankByName(
    filteredAppointments,
    (appointment) => appointment.service?.name ?? "Servico",
  );
  const professionalsRank = rankByName(
    filteredAppointments.filter((appointment) => appointment.status === "FINISHED"),
    (appointment) => appointment.professional?.user?.name ?? "Profissional",
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <Select
              label="Periodo"
              onChange={(event) => setPeriod(event.target.value)}
              value={period}
            >
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="last30">Ultimos 30 dias</option>
              <option value="custom">Personalizado</option>
            </Select>
            <Input
              disabled={period !== "custom"}
              label="Inicio"
              onChange={(event) => setCustomRange({ ...customRange, startDate: event.target.value })}
              type="date"
              value={customRange.startDate}
            />
            <Input
              disabled={period !== "custom"}
              label="Fim"
              onChange={(event) => setCustomRange({ ...customRange, endDate: event.target.value })}
              type="date"
              value={customRange.endDate}
            />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="no periodo"
          icon={CalendarDays}
          label="Agendamentos"
          value={String(filteredAppointments.length)}
        />
        <StatCard
          detail="marcados para hoje"
          icon={CalendarDays}
          label="Agendamentos hoje"
          value={String(todayAppointments.length)}
        />
        <StatCard
          detail="pagamentos pagos no periodo"
          icon={DollarSign}
          label="Faturamento pago"
          value={formatCurrency(paidRevenue)}
        />
        <StatCard
          detail="aguardando pagamento"
          icon={WalletCards}
          label="Faturamento pendente"
          value={formatCurrency(pendingRevenue)}
        />
        <StatCard
          detail="pagamentos pagos"
          icon={DollarSign}
          label="Ticket medio"
          value={formatCurrency(ticketAverage)}
        />
        <StatCard
          detail="usuarios cliente"
          icon={UsersRound}
          label="Clientes cadastrados"
          value={String(clients.length)}
        />
        <StatCard
          detail="no periodo"
          icon={UserPlus}
          label="Novos clientes"
          value={String(newClients.length)}
        />
        <StatCard detail="assinaturas ativas" icon={CreditCard} label="Planos ativos" value={String(activePlans.length)} />
        <StatCard detail="aguardando aprovacao" icon={CreditCard} label="Planos pendentes" value={String(pendingPlans.length)} />
        <StatCard detail="retirada ou analise" icon={ClipboardList} label="Pedidos pendentes" value={String(pendingOrders.length)} />
        <StatCard detail="estoque ate 3 un." icon={Package} label="Baixo estoque" value={String(lowStockProducts.length)} />
        <StatCard detail="no periodo" icon={Ban} label="Cancelamento" value={`${cancellationRate}%`} />
        <StatCard
          detail="agenda estimada"
          icon={TrendingUp}
          label="Taxa de ocupacao"
          value={`${occupancyRate}%`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard data={revenueByDay} dataKey="total" title="Faturamento por dia" valuePrefix="R$ " />
        <ChartCard data={appointmentsByDay} dataKey="total" title="Agendamentos por dia" />
        <PieChartCard data={appointmentsByStatus} title="Agendamentos por status" />
        <PieChartCard data={paymentsByMethod} title="Formas de pagamento" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <RankCard emptyLabel="Sem servicos agendados" items={servicesRank} title="Servicos mais agendados" />
        <RankCard emptyLabel="Sem atendimentos finalizados" items={professionalsRank} title="Profissionais com mais atendimentos" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DashboardList title="Proximos agendamentos" items={todayAppointments.slice(0, 6).map((appointment) => `${appointment.client?.name ?? "Cliente"} - ${appointment.service?.name ?? "Servico"} - ${formatTime(appointment.startTime)}`)} />
        <DashboardList title="Planos aguardando aprovacao" items={pendingPlans.slice(0, 6).map((subscription) => `${subscription.client?.name ?? "Cliente"} - ${subscription.plan?.name ?? "Plano"}`)} />
        <DashboardList title="Pedidos aguardando retirada" items={pendingOrders.slice(0, 6).map((order) => `${order.client?.name ?? "Cliente"} - ${order.items?.[0]?.product?.name ?? "Produto"}`)} />
        <DashboardList title="Produtos com baixo estoque" items={lowStockProducts.slice(0, 6).map((product) => `${product.name} - ${product.stock} un.`)} />
      </section>
    </div>
  );
}

const chartColors = ["#D90429", "#22c55e", "#38bdf8", "#f59e0b", "#a855f7", "#71717a"];

function resolveDashboardRange(
  period: string,
  customRange: { endDate: string; startDate: string },
) {
  const today = new Date();

  if (period === "custom") {
    return customRange;
  }

  if (period === "today") {
    const day = toDateInput(today);
    return { endDate: day, startDate: day };
  }

  if (period === "week") {
    return { endDate: toDateInput(today), startDate: toDateInput(addLocalDays(today, -6)) };
  }

  if (period === "last30") {
    return { endDate: toDateInput(today), startDate: toDateInput(addLocalDays(today, -29)) };
  }

  return {
    endDate: toDateInput(today),
    startDate: toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
  };
}

function addLocalDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function isDateKeyBetween(key: string, startDate: string, endDate: string) {
  return key >= startDate && key <= endDate;
}

function rangeKeys(startDate: string, endDate: string) {
  const keys: string[] = [];
  const cursor = localDateFromKey(startDate);
  const end = localDateFromKey(endDate);

  while (cursor <= end) {
    keys.push(toDateInput(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function daysInRange(startDate: string, endDate: string) {
  return rangeKeys(startDate, endDate).length;
}

function buildRevenueByDayForRange(payments: Payment[], startDate: string, endDate: string) {
  return rangeKeys(startDate, endDate).map((key) => ({
    date: formatShortDate(key),
    total: sumPayments(payments, (payment) => payment.status === "PAID" && dateKey(payment.createdAt) === key),
  }));
}

function buildAppointmentsByDayForRange(appointments: Appointment[], startDate: string, endDate: string) {
  return rangeKeys(startDate, endDate).map((key) => ({
    date: formatShortDate(key),
    total: appointments.filter((appointment) => appointmentDateKey(appointment) === key).length,
  }));
}

function buildPieData<T>(items: T[], labelFactory: (item: T) => string) {
  const map = new Map<string, number>();

  for (const item of items) {
    const name = labelFactory(item);
    map.set(name, (map.get(name) ?? 0) + 1);
  }

  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

function ChartCard({
  data,
  dataKey,
  title,
  valuePrefix = "",
}: {
  data: Array<{ date: string; total: number }>;
  dataKey: "total";
  title: string;
  valuePrefix?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-2xl font-semibold uppercase text-white sm:text-3xl">
          {title}
        </h2>
      </CardHeader>
      <CardContent>
        {data.some((item) => item.total > 0) ? (
          <div className="h-64 min-w-0">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={data}>
                <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} width={38} />
                <Tooltip
                  contentStyle={{ background: "#151515", border: "1px solid rgba(255,255,255,.1)", color: "#fff" }}
                  formatter={(value) => [`${valuePrefix}${value}`, title]}
                />
                <Bar dataKey={dataKey} fill="#D90429" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState description="Nao ha dados para o periodo." icon={BarChart3} title="Sem dados" />
        )}
      </CardContent>
    </Card>
  );
}

function PieChartCard({
  data,
  title,
}: {
  data: Array<{ name: string; value: number }>;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-2xl font-semibold uppercase text-white sm:text-3xl">
          {title}
        </h2>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="h-64 min-w-0">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {data.map((item, index) => (
                      <Cell fill={chartColors[index % chartColors.length]} key={item.name} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#151515", border: "1px solid rgba(255,255,255,.1)", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.map((item, index) => (
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300" key={item.name}>
                  <span className="size-3 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
                  {item.name}: {item.value}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState description="Nao ha dados para o periodo." icon={BarChart3} title="Sem dados" />
        )}
      </CardContent>
    </Card>
  );
}

function RankCard({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: Array<{ count: number; name: string }>;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-2xl font-semibold uppercase text-white sm:text-3xl">
          {title}
        </h2>
      </CardHeader>
      <CardContent>
        <RankList emptyLabel={emptyLabel} items={items} />
      </CardContent>
    </Card>
  );
}

function DashboardList({ items, title }: { items: string[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-2xl font-semibold uppercase text-white sm:text-3xl">
          {title}
        </h2>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div className="rounded-md border border-white/10 bg-club-black p-3 text-sm font-semibold text-zinc-300" key={item}>
                {item}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description="Nada encontrado para mostrar agora." icon={ClipboardList} title="Sem registros" />
        )}
      </CardContent>
    </Card>
  );
}

function AgendaSection({
  appointments,
  filters,
  onAction,
  onCancel,
  onConfirmPayment,
  onFiltersChange,
  onNewAppointment,
  professionals,
  runningAction,
}: {
  appointments: Appointment[];
  filters: AgendaFilters;
  onAction: (appointment: Appointment, action: AppointmentAction) => void;
  onCancel: (appointment: Appointment) => void;
  onConfirmPayment: (appointment: Appointment) => void;
  onFiltersChange: (filters: AgendaFilters) => void;
  onNewAppointment: () => void;
  professionals: Professional[];
  runningAction: string | null;
}) {
  const filteredAppointments = appointments
    .filter((appointment) => {
      if (filters.date && appointmentDateKey(appointment) !== filters.date) {
        return false;
      }

      if (filters.professionalId && appointment.professionalId !== filters.professionalId) {
        return false;
      }

      if (filters.status && appointment.status !== filters.status) {
        return false;
      }

      if (
        filters.client &&
        !(appointment.client?.name ?? "")
          .toLowerCase()
          .includes(filters.client.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort(
      (a, b) =>
        appointmentStartDate(b).getTime() - appointmentStartDate(a).getTime(),
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Filtros
            </h2>
            <Button onClick={onNewAppointment} size="sm" type="button">
              <Plus className="size-4" aria-hidden="true" />
              Novo agendamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              label="Data"
              onChange={(event) =>
                onFiltersChange({ ...filters, date: event.target.value })
              }
              type="date"
              value={filters.date}
            />
            <Input
              label="Cliente"
              onChange={(event) =>
                onFiltersChange({ ...filters, client: event.target.value })
              }
              placeholder="Nome do cliente"
              value={filters.client}
            />
            <Select
              label="Profissional"
              onChange={(event) =>
                onFiltersChange({ ...filters, professionalId: event.target.value })
              }
              value={filters.professionalId}
            >
              <option value="">Todos</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.user?.name ?? "Profissional"}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              onChange={(event) =>
                onFiltersChange({ ...filters, status: event.target.value })
              }
              value={filters.status}
            >
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Todos os agendamentos
            </h2>
            <Badge tone="red">{filteredAppointments.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length ? (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <AdminAppointmentCard
                  appointment={appointment}
                  key={appointment.id}
                  onCancel={onCancel}
                  onConfirmPayment={onConfirmPayment}
                  onAction={onAction}
                  runningAction={runningAction}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              description="Altere os filtros para localizar outros horarios."
              icon={CalendarDays}
              title="Sem agendamentos"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FinanceSection({
  filters,
  onFiltersChange,
  payments,
}: {
  filters: FinanceFilters;
  onFiltersChange: (filters: FinanceFilters) => void;
  payments: Payment[];
}) {
  const today = new Date();
  const todayKey = toDateInput(today);
  const filteredPayments = payments
    .filter((payment) => {
      const paymentKey = dateKey(payment.createdAt);

      if (filters.startDate && paymentKey < filters.startDate) {
        return false;
      }

      if (filters.endDate && paymentKey > filters.endDate) {
        return false;
      }

      return true;
    })
    .sort((a, b) => paymentDate(b).getTime() - paymentDate(a).getTime());
  const totalToday = sumPayments(
    payments,
    (payment) => dateKey(payment.createdAt) === todayKey,
  );
  const totalWeek = sumPayments(payments, (payment) =>
    isSameWeek(paymentDate(payment), today),
  );
  const totalMonth = sumPayments(payments, (payment) =>
    isSameMonth(paymentDate(payment), today),
  );
  const pendingCount = payments.filter(
    (payment) =>
      payment.status === "PENDING" ||
      payment.status === "AWAITING_CONFIRMATION",
  ).length;
  const paidCount = payments.filter((payment) => payment.status === "PAID").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard detail="hoje" icon={DollarSign} label="Total do dia" value={formatCurrency(totalToday)} />
        <StatCard detail="semana atual" icon={CalendarCheck} label="Total da semana" value={formatCurrency(totalWeek)} />
        <StatCard detail="mes atual" icon={CalendarDays} label="Total do mes" value={formatCurrency(totalMonth)} />
        <StatCard detail="aguardando" icon={WalletCards} label="Pendentes" value={String(pendingCount)} />
        <StatCard detail="confirmados" icon={CheckCircle2} label="Pagos" value={String(paidCount)} />
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-display text-3xl font-semibold uppercase text-white">
            Periodo
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Inicio"
              onChange={(event) =>
                onFiltersChange({ ...filters, startDate: event.target.value })
              }
              type="date"
              value={filters.startDate}
            />
            <Input
              label="Fim"
              onChange={(event) =>
                onFiltersChange({ ...filters, endDate: event.target.value })
              }
              type="date"
              value={filters.endDate}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Pagamentos
            </h2>
            <Badge tone="red">{filteredPayments.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length ? (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <div
                  className="grid gap-4 rounded-md border border-white/10 bg-club-black p-4 lg:grid-cols-[1fr_auto]"
                  key={payment.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <strong className="font-display text-2xl font-semibold uppercase text-white">
                        {payment.appointment?.service?.name ?? "Pagamento"}
                      </strong>
                      <Badge tone={getPaymentTone(payment.status)}>
                        {paymentStatusLabels[payment.status]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">
                      {payment.client?.name ?? payment.appointment?.client?.name ?? "Cliente"} -{" "}
                      {formatLocalDate(payment.createdAt)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-zinc-300">
                      Metodo: {paymentMethodLabels[payment.method]}
                    </p>
                    {payment.receiptUrl ? (
                      <a
                        className="mt-2 inline-flex text-sm font-bold text-club-red underline-offset-4 hover:underline"
                        href={payment.receiptUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {payment.receiptFileName ?? "Ver comprovante"}
                      </a>
                    ) : null}
                  </div>
                  <strong className="font-display text-3xl font-semibold text-white lg:text-right">
                    {formatCurrency(payment.amount)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Nenhum pagamento encontrado neste periodo."
              icon={WalletCards}
              title="Sem pagamentos"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsSection({
  appointments,
  payments,
  planSubscriptions,
  productOrders,
  professionals,
  services,
  users,
}: {
  appointments: Appointment[];
  payments: Payment[];
  planSubscriptions: ClientPlan[];
  productOrders: ProductOrder[];
  professionals: Professional[];
  services: Service[];
  users: User[];
}) {
  const [kind, setKind] = useState("appointments");
  const [filters, setFilters] = useState({
    endDate: toDateInput(new Date()),
    paymentMethod: "",
    professionalId: "",
    serviceId: "",
    startDate: toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    status: "",
  });
  const rows = buildReportRows({
    appointments,
    filters,
    kind,
    payments,
    planSubscriptions,
    productOrders,
    users,
  });
  const totalValue = rows.reduce((total, row) => total + Number(row.valor ?? 0), 0);

  function exportCsv() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${kind}-${filters.startDate}-a-${filters.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold uppercase text-white">
                Relatorios
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Filtros por periodo, barbeiro, servico, status e pagamento.
              </p>
            </div>
            <Button disabled={!rows.length} onClick={exportCsv} type="button">
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Select label="Relatorio" onChange={(event) => setKind(event.target.value)} value={kind}>
              <option value="appointments">Agendamentos</option>
              <option value="financial">Financeiro</option>
              <option value="clients">Clientes</option>
              <option value="products">Produtos/Pedidos</option>
              <option value="plans">Planos</option>
            </Select>
            <Input label="Inicio" onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} type="date" value={filters.startDate} />
            <Input label="Fim" onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} type="date" value={filters.endDate} />
            <Select label="Barbeiro" onChange={(event) => setFilters({ ...filters, professionalId: event.target.value })} value={filters.professionalId}>
              <option value="">Todos</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>{professional.user?.name ?? "Profissional"}</option>
              ))}
            </Select>
            <Select label="Servico" onChange={(event) => setFilters({ ...filters, serviceId: event.target.value })} value={filters.serviceId}>
              <option value="">Todos</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </Select>
            <Input label="Status" onChange={(event) => setFilters({ ...filters, status: event.target.value })} placeholder="Ex: PAID" value={filters.status} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard detail="registros filtrados" icon={ClipboardList} label="Total" value={String(rows.length)} />
            <StatCard detail="quando aplicavel" icon={DollarSign} label="Valor" value={formatCurrency(totalValue)} />
            <StatCard detail="arquivo CSV" icon={BarChart3} label="Exportacao" value={rows.length ? "Pronta" : "Sem dados"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500">
                  <tr>
                    {Object.keys(rows[0]).map((key) => (
                      <th className="px-3 py-2" key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {rows.map((row, index) => (
                    <tr key={`${row.id}-${index}`} className="text-zinc-300">
                      {Object.values(row).map((value, cellIndex) => (
                        <td className="px-3 py-3" key={cellIndex}>{String(value ?? "-")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState description="Altere os filtros para gerar um relatorio." icon={BarChart3} title="Sem dados" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function buildReportRows({
  appointments,
  filters,
  kind,
  payments,
  planSubscriptions,
  productOrders,
  users,
}: {
  appointments: Appointment[];
  filters: {
    endDate: string;
    paymentMethod: string;
    professionalId: string;
    serviceId: string;
    startDate: string;
    status: string;
  };
  kind: string;
  payments: Payment[];
  planSubscriptions: ClientPlan[];
  productOrders: ProductOrder[];
  users: User[];
}) {
  if (kind === "financial") {
    return payments
      .filter((payment) => isDateKeyBetween(dateKey(payment.createdAt), filters.startDate, filters.endDate))
      .filter((payment) => (filters.status ? payment.status === filters.status : true))
      .map((payment) => ({
        id: payment.id,
        cliente: payment.client?.name ?? payment.appointment?.client?.name ?? "-",
        data: formatLocalDate(payment.createdAt),
        metodo: paymentMethodLabels[payment.method],
        status: paymentStatusLabels[payment.status],
        valor: payment.amount,
      }));
  }

  if (kind === "clients") {
    return users
      .filter((user) => user.role === "CLIENT")
      .filter((user) => isDateKeyBetween(dateKey(user.createdAt), filters.startDate, filters.endDate))
      .map((user) => ({
        id: user.id,
        cliente: user.name,
        email: user.email,
        telefone: user.phone,
        status: user.active ? "Ativo" : "Inativo",
        valor: 0,
      }));
  }

  if (kind === "products") {
    return productOrders
      .filter((order) => isDateKeyBetween(dateKey(order.createdAt), filters.startDate, filters.endDate))
      .filter((order) => (filters.status ? order.status === filters.status : true))
      .map((order) => ({
        id: order.id,
        cliente: order.client?.name ?? "-",
        data: formatLocalDate(order.createdAt),
        produto: order.items?.[0]?.product?.name ?? "-",
        status: productOrderStatusLabels[order.status],
        valor: order.total,
      }));
  }

  if (kind === "plans") {
    return planSubscriptions
      .filter((subscription) => isDateKeyBetween(dateKey(subscription.createdAt), filters.startDate, filters.endDate))
      .filter((subscription) => (filters.status ? subscription.status === filters.status : true))
      .map((subscription) => ({
        id: subscription.id,
        cliente: subscription.client?.name ?? "-",
        data: formatLocalDate(subscription.createdAt),
        plano: subscription.plan?.name ?? "-",
        status: clientPlanStatusLabels[subscription.status],
        valor: subscription.plan?.price ?? 0,
      }));
  }

  return appointments
    .filter((appointment) => isDateKeyBetween(appointmentDateKey(appointment), filters.startDate, filters.endDate))
    .filter((appointment) => (filters.professionalId ? appointment.professionalId === filters.professionalId : true))
    .filter((appointment) => (filters.serviceId ? appointment.serviceId === filters.serviceId : true))
    .filter((appointment) => (filters.status ? appointment.status === filters.status : true))
    .map((appointment) => ({
      id: appointment.id,
      cliente: appointment.client?.name ?? "-",
      data: formatLocalDate(appointment.date),
      servico: appointment.service?.name ?? "-",
      status: statusLabels[appointment.status],
      valor: appointment.totalValue,
    }));
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers
      .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );

  return [headers.join(","), ...lines].join("\n");
}

function CatalogSection({
  description,
  items,
  kind,
  onActivate,
  onDeactivate,
  onEdit,
  onNew,
  runningAction,
  title,
}: {
  description: string;
  items: Array<Plan | Product | Reward | Service>;
  kind: CatalogKind;
  onActivate: (kind: CatalogKind, item: Plan | Product | Reward | Service) => void;
  onDeactivate: (kind: CatalogKind, item: Plan | Product | Reward | Service) => void;
  onEdit: (kind: CatalogKind, item?: Plan | Product | Reward | Service) => void;
  onNew: (kind: CatalogKind) => void;
  runningAction: string | null;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          </div>
          <Button onClick={() => onNew(kind)} type="button">
            <Plus className="size-4" aria-hidden="true" />
            Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <CatalogCard
                item={item}
                key={item.id}
                kind={kind}
                onActivate={onActivate}
                onDeactivate={onDeactivate}
                onEdit={onEdit}
                runningAction={runningAction}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Crie o primeiro cadastro usando o botao Novo."
            icon={Package}
            title="Sem cadastros"
          />
        )}
      </CardContent>
    </Card>
  );
}

function PlanSubscriptionsSection({
  onAction,
  onPaymentLink,
  runningAction,
  subscriptions,
}: {
  onAction: (
    subscription: ClientPlan,
    action: "approve" | "cancel" | "renew",
  ) => void;
  onPaymentLink: (subscription: ClientPlan, infinityPayUrl: string) => void;
  runningAction: string | null;
  subscriptions: ClientPlan[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Solicitações
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Aprovação, cancelamento e renovação de planos.
            </p>
          </div>
          <Badge tone="red">{subscriptions.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {subscriptions.length ? (
          <div className="space-y-3">
            {subscriptions.map((subscription) => (
              <article
                className="grid gap-4 rounded-md border border-white/10 bg-club-black p-4 lg:grid-cols-[1fr_auto]"
                key={subscription.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-display text-2xl font-semibold uppercase text-white">
                      {subscription.client?.name ?? "Cliente"}
                    </strong>
                    <Badge tone={getClientPlanTone(subscription.status)}>
                      {clientPlanStatusLabels[subscription.status]}
                    </Badge>
                    <Badge tone={getPaymentTone(subscription.paymentStatus)}>
                      {paymentStatusLabels[subscription.paymentStatus]}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-400 sm:grid-cols-4">
                    <Info label="Plano" value={subscription.plan?.name ?? "-"} />
                    <Info
                      label="Valor"
                      value={subscription.plan ? formatCurrency(subscription.plan.price) : "-"}
                    />
                    <Info label="Solicitado" value={formatLocalDate(subscription.createdAt)} />
                    <Info
                      label="Vencimento"
                      value={subscription.endDate ? formatLocalDate(subscription.endDate) : "-"}
                    />
                  </div>
                  <form
                    className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      onPaymentLink(subscription, String(formData.get("infinityPayUrl") ?? ""));
                    }}
                  >
                    <input
                      className="h-10 min-w-0 rounded-md border border-white/10 bg-club-surface px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-club-red"
                      defaultValue={subscription.infinityPayUrl ?? ""}
                      name="infinityPayUrl"
                      placeholder="Link Infinity Pay"
                      type="url"
                    />
                    {subscription.infinityPayUrl ? (
                      <Button
                        onClick={() => navigator.clipboard.writeText(subscription.infinityPayUrl ?? "")}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <ClipboardCopy className="size-4" aria-hidden="true" />
                        Copiar
                      </Button>
                    ) : null}
                    <Button
                      isLoading={runningAction === `plan:link:${subscription.id}`}
                      size="sm"
                      type="submit"
                      variant="secondary"
                    >
                      Salvar link
                    </Button>
                  </form>
                  {subscription.receiptUrl ? (
                    <a
                      className="mt-3 inline-flex text-sm font-bold text-club-red underline-offset-4 hover:underline"
                      href={subscription.receiptUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {subscription.receiptFileName ?? "Ver comprovante"}
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  {subscription.status === "PENDING" ? (
                    <Button
                      isLoading={runningAction === `plan:approve:${subscription.id}`}
                      onClick={() => onAction(subscription, "approve")}
                      size="sm"
                      type="button"
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Aprovar
                    </Button>
                  ) : null}
                  {subscription.status === "ACTIVE" || subscription.status === "EXPIRED" ? (
                    <Button
                      isLoading={runningAction === `plan:renew:${subscription.id}`}
                      onClick={() => onAction(subscription, "renew")}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Renovar
                    </Button>
                  ) : null}
                  {subscription.status !== "CANCELED" ? (
                    <Button
                      isLoading={runningAction === `plan:cancel:${subscription.id}`}
                      onClick={() => onAction(subscription, "cancel")}
                      size="sm"
                      type="button"
                      variant="danger"
                    >
                      <XCircle className="size-4" aria-hidden="true" />
                      Cancelar
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Solicitações de assinatura aparecem aqui."
            icon={CreditCard}
            title="Sem solicitações"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProductOrdersSection({
  filters,
  onFiltersChange,
  onPaymentLink,
  onUpdate,
  orders,
  runningAction,
}: {
  filters: ProductOrderFilters;
  onFiltersChange: (filters: ProductOrderFilters) => void;
  onUpdate: (
    order: ProductOrder,
    data: Partial<Pick<ProductOrder, "paymentMethod" | "paymentStatus" | "status">>,
  ) => void;
  onPaymentLink: (order: ProductOrder, infinityPayUrl: string) => void;
  orders: ProductOrder[];
  runningAction: string | null;
}) {
  const filteredOrders = orders.filter((order) => {
    const productName = order.items?.[0]?.product?.name ?? "";
    const clientName = order.client?.name ?? "";
    const dateMatches = filters.date ? dateKey(order.createdAt) === filters.date : true;
    const statusMatches = filters.status ? order.status === filters.status : true;
    const typeMatches = filters.type ? order.orderType === filters.type : true;
    const clientMatches = filters.client
      ? clientName.toLocaleLowerCase("pt-BR").includes(filters.client.toLocaleLowerCase("pt-BR"))
      : true;
    const productMatches = filters.product
      ? productName.toLocaleLowerCase("pt-BR").includes(filters.product.toLocaleLowerCase("pt-BR"))
      : true;

    return dateMatches && statusMatches && typeMatches && clientMatches && productMatches;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Pedidos
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Reservas, encomendas, pagamentos e retiradas.
            </p>
          </div>
          <Badge tone="red">{filteredOrders.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className="h-12 rounded-md border border-white/10 bg-club-black px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-club-red"
            onChange={(event) => onFiltersChange({ ...filters, client: event.target.value })}
            placeholder="Cliente"
            value={filters.client}
          />
          <input
            className="h-12 rounded-md border border-white/10 bg-club-black px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-club-red"
            onChange={(event) => onFiltersChange({ ...filters, product: event.target.value })}
            placeholder="Produto"
            value={filters.product}
          />
          <Select
            onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
            value={filters.status}
          >
            <option value="">Todos status</option>
            {Object.entries(productOrderStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            onChange={(event) => onFiltersChange({ ...filters, type: event.target.value })}
            value={filters.type}
          >
            <option value="">Todos tipos</option>
            {Object.entries(productOrderTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            onChange={(event) => onFiltersChange({ ...filters, date: event.target.value })}
            type="date"
            value={filters.date}
          />
        </div>

        {filteredOrders.length ? (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <ProductOrderAdminCard
                key={order.id}
                onPaymentLink={onPaymentLink}
                onUpdate={onUpdate}
                order={order}
                runningAction={runningAction}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Nenhum pedido encontrado com os filtros atuais."
            icon={ClipboardList}
            title="Sem pedidos"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProductOrderAdminCard({
  onPaymentLink,
  onUpdate,
  order,
  runningAction,
}: {
  onPaymentLink: (order: ProductOrder, infinityPayUrl: string) => void;
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
  const canCancel = order.status !== "CANCELED" && order.status !== "DELIVERED";
  const canDeliver =
    order.status === "RESERVED" || order.status === "AVAILABLE_FOR_PICKUP";

  return (
    <article className="grid gap-4 rounded-md border border-white/10 bg-club-black p-4 xl:grid-cols-[1fr_18rem]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <strong className="font-display text-2xl font-semibold uppercase text-white">
            {firstItem?.product?.name ?? "Produto"}
          </strong>
          <Badge tone={getProductOrderTone(order.status)}>
            {productOrderStatusLabels[order.status]}
          </Badge>
          <Badge tone={getPaymentTone(order.paymentStatus)}>
            {paymentStatusLabels[order.paymentStatus]}
          </Badge>
          <Badge tone="zinc">{productOrderTypeLabels[order.orderType]}</Badge>
        </div>
        <div className="mt-3 grid gap-2 text-sm text-zinc-400 sm:grid-cols-4">
          <Info label="Cliente" value={order.client?.name ?? "-"} />
          <Info label="Quantidade" value={String(firstItem?.quantity ?? 0)} />
          <Info label="Valor" value={formatCurrency(order.total)} />
          <Info label="Data" value={formatLocalDate(order.createdAt)} />
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
        <form
          className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            onPaymentLink(order, String(formData.get("infinityPayUrl") ?? ""));
          }}
        >
          <input
            className="h-10 min-w-0 rounded-md border border-white/10 bg-club-surface px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-club-red"
            defaultValue={order.infinityPayUrl ?? ""}
            name="infinityPayUrl"
            placeholder="Link Infinity Pay"
            type="url"
          />
          {order.infinityPayUrl ? (
            <Button
              onClick={() => navigator.clipboard.writeText(order.infinityPayUrl ?? "")}
              size="sm"
              type="button"
              variant="secondary"
            >
              <ClipboardCopy className="size-4" aria-hidden="true" />
              Copiar
            </Button>
          ) : null}
          <Button
            isLoading={runningAction === `order:link:${order.id}`}
            size="sm"
            type="submit"
            variant="secondary"
          >
            Salvar link
          </Button>
        </form>
      </div>

      <div className="grid gap-2">
        <Select
          onChange={(event) =>
            onUpdate(order, {
              status: event.target.value as ProductOrder["status"],
            })
          }
          value={order.status}
        >
          {Object.entries(productOrderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {canConfirmPayment ? (
          <Button
            isLoading={runningAction === `order:${order.id}`}
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
          isLoading={runningAction === `order:${order.id}`}
          onClick={() => onUpdate(order, { status: "DELIVERED" })}
          size="sm"
          type="button"
          variant="secondary"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Entregue
        </Button>
        {canCancel ? (
          <Button
            isLoading={runningAction === `order:${order.id}`}
            onClick={() => onUpdate(order, { paymentStatus: "CANCELED", status: "CANCELED" })}
            size="sm"
            type="button"
            variant="danger"
          >
            <XCircle className="size-4" aria-hidden="true" />
            Cancelar
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function MarketingSection({
  appointments,
  onCopy,
  users,
}: {
  appointments: Appointment[];
  onCopy: (message: string) => void;
  users: User[];
}) {
  const now = new Date();
  const clients = users.filter((item) => item.role === "CLIENT");
  const birthdayClients = clients.filter((client) => {
    if (!client.birthDate) {
      return false;
    }

    return localDateFromKey(dateKey(client.birthDate)).getMonth() === now.getMonth();
  });
  const inactiveClients = clients.filter((client) => {
    const clientAppointments = appointments.filter(
      (appointment) =>
        appointment.clientId === client.id && appointment.status !== "CANCELED",
    );

    if (!clientAppointments.length) {
      return true;
    }

    const latest = clientAppointments
      .map(appointmentStartDate)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const diffDays = Math.floor(
      (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24),
    );

    return diffDays > 30;
  });

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <MarketingList
        emptyDescription="Cadastre a data de nascimento do cliente para usar esta lista."
        icon={Gift}
        messageFactory={birthdayMessage}
        onCopy={onCopy}
        title="Aniversariantes do mes"
        users={birthdayClients}
      />
      <MarketingList
        emptyDescription="Clientes recentes ou ativos nao entram nesta lista."
        icon={MessageCircle}
        messageFactory={inactiveMessage}
        onCopy={onCopy}
        title="Clientes inativos"
        users={inactiveClients}
      />
    </div>
  );
}

function TeamSection({
  onEdit,
  onNew,
  onOpenAgenda,
  onToggleActive,
  professionals,
}: {
  onEdit: (professional: Professional) => void;
  onNew: () => void;
  onOpenAgenda: (professional: Professional) => void;
  onToggleActive: (professional: Professional, active: boolean) => void;
  professionals: Professional[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Profissionais
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Cadastros, comissao e acesso da equipe.
            </p>
          </div>
          <Button onClick={onNew} type="button">
            <UserPlus className="size-4" aria-hidden="true" />
            Criar profissional
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {professionals.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {professionals.map((professional) => (
              <div
                className="rounded-md border border-white/10 bg-club-black p-4"
                key={professional.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <strong className="block truncate font-display text-2xl font-semibold uppercase text-white">
                      {professional.user?.name ?? "Profissional"}
                    </strong>
                    <p className="mt-1 text-sm text-zinc-500">
                      {professional.specialty}
                    </p>
                  </div>
                  <Badge tone={professional.active ? "green" : "zinc"}>
                    {professional.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm text-zinc-400">
                  <p>{professional.user?.email}</p>
                  <p>{professional.user?.phone}</p>
                  <p>Comissao: {Number(professional.commissionPercent).toFixed(2)}%</p>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button onClick={() => onEdit(professional)} size="sm" type="button" variant="secondary">
                    <Edit3 className="size-4" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button onClick={() => onOpenAgenda(professional)} size="sm" type="button" variant="secondary">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    Agenda
                  </Button>
                  {professional.active ? (
                    <Button onClick={() => onToggleActive(professional, false)} size="sm" type="button" variant="danger">
                      <Ban className="size-4" aria-hidden="true" />
                      Desativar
                    </Button>
                  ) : (
                    <Button onClick={() => onToggleActive(professional, true)} size="sm" type="button">
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Ativar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Crie profissionais para liberar agenda e atendimentos."
            icon={UsersRound}
            title="Sem profissionais"
          />
        )}
      </CardContent>
    </Card>
  );
}

function AdminAppointmentCard({
  appointment,
  onAction,
  onCancel,
  onConfirmPayment,
  runningAction,
}: {
  appointment: Appointment;
  onAction: (appointment: Appointment, action: AppointmentAction) => void;
  onCancel: (appointment: Appointment) => void;
  onConfirmPayment: (appointment: Appointment) => void;
  runningAction: string | null;
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
    <article className="grid gap-4 rounded-md border border-white/10 bg-club-black p-4 xl:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <strong className="font-display text-2xl font-semibold uppercase text-white">
            {appointment.service?.name ?? "Servico"}
          </strong>
          <Badge tone={getStatusTone(appointment.status)}>
            {statusLabels[appointment.status]}
          </Badge>
          <Badge tone={getPaymentTone(paymentStatus)}>
            {paymentStatusLabels[paymentStatus]}
          </Badge>
          {appointment.isExtraSlot ? <Badge tone="red">Encaixe</Badge> : null}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-zinc-400 md:grid-cols-3">
          <Info label="Cliente" value={appointment.client?.name ?? "Cliente"} />
          <Info
            label="Profissional"
            value={appointment.professional?.user?.name ?? "Profissional"}
          />
          <Info label="Data" value={formatLocalDate(appointment.date)} />
          <Info
            label="Horario"
            value={`${timeValue(appointment.startTime)} - ${timeValue(appointment.endTime)}`}
          />
          <Info label="Valor" value={formatCurrency(appointment.totalValue)} />
          <Info label="Status" value={statusLabels[appointment.status]} />
        </div>
        {appointment.cancelReason ? (
          <p className="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm font-semibold text-zinc-400">
            Motivo do cancelamento: {appointment.cancelReason}
          </p>
        ) : null}
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
      <div className="grid gap-2 sm:grid-cols-2 xl:w-72">
        {canConfirmPayment ? (
          <Button
            isLoading={runningAction === `payment:${appointment.id}`}
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
          isLoading={runningAction === `confirm:${appointment.id}`}
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
          isLoading={runningAction === `cancel:${appointment.id}`}
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
          isLoading={runningAction === `finish:${appointment.id}`}
          onClick={() => onAction(appointment, "finish")}
          size="sm"
          type="button"
        >
          <Scissors className="size-4" aria-hidden="true" />
          Finalizar
        </Button>
        <Button
          onClick={() => onAction(appointment, "delete")}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Excluir
        </Button>
      </div>
    </article>
  );
}

function CatalogCard({
  item,
  kind,
  onActivate,
  onDeactivate,
  onEdit,
  runningAction,
}: {
  item: Plan | Product | Reward | Service;
  kind: CatalogKind;
  onActivate: (kind: CatalogKind, item: Plan | Product | Reward | Service) => void;
  onDeactivate: (kind: CatalogKind, item: Plan | Product | Reward | Service) => void;
  onEdit: (kind: CatalogKind, item: Plan | Product | Reward | Service) => void;
  runningAction: string | null;
}) {
  return (
    <article className="rounded-md border border-white/10 bg-club-black p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <strong className="block truncate font-display text-2xl font-semibold uppercase text-white">
            {item.name}
          </strong>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
            {item.description ?? "Sem descricao"}
          </p>
        </div>
        <Badge tone={item.active ? "green" : "zinc"}>
          {item.active ? "Ativo" : "Inativo"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-sm text-zinc-400">
        {kind === "service" ? (
          <>
            <Info label="Preco" value={formatCurrency((item as Service).price)} />
            <Info label="Duracao" value={getServiceDurationLabel(item as Service)} />
          </>
        ) : null}
        {kind === "product" ? (
          <>
            <Info label="Estoque" value={String((item as Product).stock)} />
            <Info label="Reservado" value={String((item as Product).reservedStock)} />
            <Info label="Venda" value={formatCurrency((item as Product).price)} />
            <Info label="Custo" value={formatCurrency((item as Product).costPrice)} />
            <Info label="Categoria" value={(item as Product).category} />
          </>
        ) : null}
        {kind === "plan" ? (
          <>
            <Info label="Preco" value={formatCurrency((item as Plan).price)} />
            <Info label="Beneficios" value={`${(item as Plan).benefits.length} itens`} />
            <Info label="Destaque" value={(item as Plan).highlighted ? "Sim" : "Nao"} />
          </>
        ) : null}
        {kind === "reward" ? (
          <>
            <Info label="Pontos" value={String((item as Reward).requiredPoints)} />
            <Info label="Tipo" value={(item as Reward).rewardType} />
          </>
        ) : null}
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button onClick={() => onEdit(kind, item)} size="sm" type="button" variant="secondary">
          <Edit3 className="size-4" aria-hidden="true" />
          Editar
        </Button>
        {item.active ? (
          <Button onClick={() => onDeactivate(kind, item)} size="sm" type="button" variant="danger">
            <Ban className="size-4" aria-hidden="true" />
            Desativar
          </Button>
        ) : (
          <Button
            isLoading={runningAction === `activate:${kind}:${item.id}`}
            onClick={() => onActivate(kind, item)}
            size="sm"
            type="button"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Ativar
          </Button>
        )}
      </div>
    </article>
  );
}

function CatalogModal({
  form,
  isLoading,
  modal,
  onClose,
  onSave,
  products,
  services,
}: {
  form: CatalogForm;
  isLoading: boolean;
  modal: CatalogModalState;
  onClose: () => void;
  onSave: (data: CatalogForm) => void;
  products: Product[];
  services: Service[];
}) {
  const schema =
    modal?.kind === "product"
      ? productAdminSchema
      : modal?.kind === "plan"
        ? planAdminSchema
        : modal?.kind === "reward"
          ? rewardAdminSchema
          : serviceAdminSchema;
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
  } = useForm<CatalogForm>({
    defaultValues: form,
    mode: "onTouched",
    resolver: zodResolver(schema) as unknown as Resolver<CatalogForm>,
  });

  useEffect(() => {
    reset(form);
  }, [form, reset]);

  if (!modal) {
    return null;
  }

  return (
    <Modal
      description="Preencha os campos e salve para atualizar o catalogo."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button form="catalog-form" isLoading={isLoading} type="submit">
            Salvar
          </Button>
        </div>
      }
      isOpen={Boolean(modal)}
      maxWidthClassName="max-w-2xl"
      onClose={onClose}
      title={modal.mode === "create" ? "Novo cadastro" : "Editar cadastro"}
    >
      <form
        id="catalog-form"
        className="space-y-4"
        onSubmit={handleSubmit(onSave as SubmitHandler<CatalogForm>)}
      >
        <Input
          error={errors.name?.message}
          label="Nome"
          {...register("name")}
        />
        <Textarea
          error={errors.description?.message}
          label="Descricao"
          {...register("description")}
        />

        {modal.kind === "service" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              error={errors.price?.message}
              label="Preco"
              min="0"
              step="0.01"
              type="number"
              {...register("price")}
            />
            <Input
              error={errors.durationMinutes?.message}
              label="Duracao em minutos"
              min="1"
              type="number"
              {...register("durationMinutes")}
            />
            <Input
              className="sm:col-span-2"
              error={errors.durationLabel?.message}
              label="Rotulo de duracao"
              placeholder="Ex.: 30 min ou Sem duracao definida"
              {...register("durationLabel")}
            />
            <Input
              className="sm:col-span-2"
              error={errors.imageUrl?.message}
              label="Imagem"
              {...register("imageUrl")}
            />
          </div>
        ) : null}

        {modal.kind === "product" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              error={errors.stock?.message}
              label="Estoque"
              min="0"
              type="number"
              {...register("stock")}
            />
            <Input
              error={errors.costPrice?.message}
              label="Custo"
              min="0"
              step="0.01"
              type="number"
              {...register("costPrice")}
            />
            <Input
              error={errors.price?.message}
              label="Venda"
              min="0"
              step="0.01"
              type="number"
              {...register("price")}
            />
            <Input
              error={errors.category?.message}
              label="Categoria"
              {...register("category")}
            />
            <Input
              className="sm:col-span-2"
              error={errors.imageUrl?.message}
              label="Imagem"
              {...register("imageUrl")}
            />
            <div className="sm:col-span-2">
              <CheckboxField
                checked={watch("allowPreOrder")}
                label="Permitir encomenda"
                onChange={(allowPreOrder) =>
                  setValue("allowPreOrder", allowPreOrder, { shouldDirty: true })
                }
              />
            </div>
          </div>
        ) : null}

        {modal.kind === "plan" ? (
          <div className="space-y-4">
            <Input
              error={errors.price?.message}
              label="Preco"
              min="0"
              step="0.01"
              type="number"
              {...register("price")}
            />
            <Textarea
              error={errors.benefits?.message}
              label="Beneficios"
              placeholder="Um beneficio por linha"
              {...register("benefits")}
            />
            <CheckboxField
              checked={watch("highlighted")}
              label="Plano recomendado"
              onChange={(highlighted) =>
                setValue("highlighted", highlighted, { shouldDirty: true })
              }
            />
          </div>
        ) : null}

        {modal.kind === "reward" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              error={errors.rewardType?.message}
              label="Tipo"
              {...register("rewardType")}
            >
              <option value="SERVICE">Servico</option>
              <option value="PRODUCT">Produto</option>
              <option value="DISCOUNT">Desconto</option>
              <option value="GIFT">Brinde</option>
            </Select>
            <Input
              error={errors.requiredPoints?.message}
              label="Pontos necessarios"
              min="0"
              type="number"
              {...register("requiredPoints")}
            />
            {watch("rewardType") === "SERVICE" ? (
              <Select
                className="sm:col-span-2"
                error={errors.serviceId?.message}
                label="Servico vinculado"
                {...register("serviceId")}
              >
                <option value="">Cupom de servico sem vinculo</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            ) : null}
            {watch("rewardType") === "PRODUCT" || watch("rewardType") === "GIFT" ? (
              <Select
                className="sm:col-span-2"
                error={errors.productId?.message}
                label="Produto vinculado"
                {...register("productId")}
              >
                <option value="">Selecione produto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            ) : null}
            {watch("rewardType") === "DISCOUNT" ? (
              <Input
                className="sm:col-span-2"
                error={errors.discountValue?.message}
                label="Valor do desconto"
                min="0"
                step="0.01"
                type="number"
                {...register("discountValue")}
              />
            ) : null}
            <Input
              className="sm:col-span-2"
              error={errors.imageUrl?.message}
              label="Imagem"
              {...register("imageUrl")}
            />
          </div>
        ) : null}

        <CheckboxField
          checked={watch("active")}
          label="Ativo"
          onChange={(active) => setValue("active", active, { shouldDirty: true })}
        />

      </form>
    </Modal>
  );
}

function TeamModal({
  form,
  isLoading,
  modal,
  onClose,
  onSave,
}: {
  form: TeamForm;
  isLoading: boolean;
  modal: TeamModalState;
  onClose: () => void;
  onSave: (data: TeamForm) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<TeamForm>({
    defaultValues: form,
    mode: "onTouched",
    resolver: zodResolver(
      modal?.mode === "create" ? createTeamAdminSchema : editTeamAdminSchema,
    ) as unknown as Resolver<TeamForm>,
  });
  const phoneField = register("phone");

  useEffect(() => {
    reset(form);
  }, [form, reset]);

  if (!modal) {
    return null;
  }

  return (
    <Modal
      description="Dados de acesso e ficha profissional."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button form="team-form" isLoading={isLoading} type="submit">
            Salvar
          </Button>
        </div>
      }
      isOpen={Boolean(modal)}
      maxWidthClassName="max-w-2xl"
      onClose={onClose}
      title={modal.mode === "create" ? "Criar profissional" : "Editar profissional"}
    >
      <form
        id="team-form"
        className="space-y-4"
        onSubmit={handleSubmit(onSave as SubmitHandler<TeamForm>)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            error={errors.name?.message}
            label="Nome"
            {...register("name")}
          />
          <Input
            error={errors.email?.message}
            label="Email"
            type="email"
            {...register("email")}
          />
          <Input
            error={errors.phone?.message}
            label="Telefone"
            {...phoneField}
            onChange={(event) => {
              event.target.value = maskPhone(event.target.value);
              phoneField.onChange(event);
            }}
          />
          <Input
            error={errors.birthDate?.message}
            label="Nascimento"
            type="date"
            {...register("birthDate")}
          />
          <Input
            error={errors.password?.message}
            label={modal.mode === "create" ? "Senha inicial" : "Nova senha"}
            placeholder={modal.mode === "edit" ? "Opcional" : ""}
            type="password"
            {...register("password")}
          />
          <Input
            error={errors.commissionPercent?.message}
            label="Comissao"
            min="0"
            step="0.01"
            type="number"
            {...register("commissionPercent")}
          />
        </div>
        <Input
          error={errors.specialty?.message}
          label="Especialidade"
          {...register("specialty")}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckboxField
            checked={watch("active")}
            label="Ativo"
            onChange={(active) => setValue("active", active, { shouldDirty: true })}
          />
          <CheckboxField
            checked={watch("online")}
            label="Online"
            onChange={(online) => setValue("online", online, { shouldDirty: true })}
          />
        </div>
      </form>
    </Modal>
  );
}

function MarketingList({
  emptyDescription,
  icon: Icon,
  messageFactory,
  onCopy,
  title,
  users,
}: {
  emptyDescription: string;
  icon: LucideIcon;
  messageFactory: (name: string) => string;
  onCopy: (message: string) => void;
  title: string;
  users: User[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold uppercase text-white">
            {title}
          </h2>
          <span className="flex size-10 items-center justify-center rounded-md bg-club-red/10 text-club-red">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {users.length ? (
          <div className="space-y-3">
            {users.map((client) => {
              const message = messageFactory(client.name);

              return (
                <div
                  className="rounded-md border border-white/10 bg-club-black p-4"
                  key={client.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <strong className="font-display text-2xl font-semibold uppercase text-white">
                        {client.name}
                      </strong>
                      <p className="mt-1 text-sm text-zinc-500">
                        {client.phone}
                        {client.birthDate ? ` - ${formatLocalDate(client.birthDate)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button onClick={() => onCopy(message)} size="sm" type="button" variant="secondary">
                        <ClipboardCopy className="size-4" aria-hidden="true" />
                        Copiar
                      </Button>
                      <a href={whatsappUrl(client.phone, message)} rel="noreferrer" target="_blank">
                        <Button className="w-full" size="sm" type="button">
                          <MessageCircle className="size-4" aria-hidden="true" />
                          WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                  <p className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-300">
                    {message}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            description={emptyDescription}
            icon={MessageCircle}
            title="Nenhum cliente"
          />
        )}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0">
      <span className="block text-xs font-bold uppercase text-zinc-600">{label}</span>
      <span className="mt-1 block truncate font-semibold text-zinc-300">{value}</span>
    </p>
  );
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-md border border-white/10 bg-club-black px-4 text-sm font-bold text-zinc-300">
      <input
        checked={checked}
        className="size-4 accent-club-red"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function BarRow({
  label,
  max,
  value,
  valueLabel,
}: {
  label: string;
  max: number;
  value: number;
  valueLabel: string;
}) {
  const width = Math.max((value / max) * 100, value > 0 ? 8 : 0);

  return (
    <div className="grid gap-2 sm:grid-cols-[8rem_1fr_8rem] sm:items-center">
      <span className="text-sm font-bold uppercase text-zinc-500">{label}</span>
      <div className="h-3 overflow-hidden rounded-full bg-club-black">
        <div
          className="h-full rounded-full bg-club-red"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm font-bold text-zinc-200 sm:text-right">
        {valueLabel}
      </span>
    </div>
  );
}

function RankList({
  emptyLabel,
  items,
}: {
  emptyLabel: string;
  items: Array<{ count: number; name: string }>;
}) {
  if (!items.length) {
    return (
      <EmptyState
        description="Os dados aparecem automaticamente conforme a agenda movimenta."
        icon={BarChart3}
        title={emptyLabel}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item, index) => (
        <div
          className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-club-black p-4"
          key={item.name}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-club-red/10 font-display text-xl font-semibold text-club-red">
              {index + 1}
            </span>
            <strong className="truncate text-sm font-bold text-white">
              {item.name}
            </strong>
          </div>
          <Badge tone="red">{item.count}</Badge>
        </div>
      ))}
    </div>
  );
}

function buildRevenueByDay(payments: Payment[]) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = toDateInput(date);
    const total = sumPayments(payments, (payment) => dateKey(payment.createdAt) === key);

    return { date: key, total };
  });
}

function rankByName<T>(items: T[], getName: (item: T) => string) {
  const countMap = new Map<string, number>();

  items.forEach((item) => {
    const name = getName(item);
    countMap.set(name, (countMap.get(name) ?? 0) + 1);
  });

  return Array.from(countMap.entries())
    .map(([name, count]) => ({ count, name }))
    .sort((a, b) => b.count - a.count);
}

function catalogEndpoint(kind: CatalogKind) {
  const endpoints: Record<CatalogKind, string> = {
    plan: "/plans",
    product: "/products",
    reward: "/rewards",
    service: "/services",
  };

  return endpoints[kind];
}

function catalogPayload(kind: CatalogKind, form: CatalogForm) {
  if (kind === "service") {
    return {
      endpoint: catalogEndpoint(kind),
      payload: {
        active: form.active,
        description: form.description || null,
        durationLabel: form.durationLabel || null,
        durationMinutes: form.durationMinutes,
        imageUrl: form.imageUrl || null,
        name: form.name,
        price: form.price,
      },
    };
  }

  if (kind === "product") {
    return {
      endpoint: catalogEndpoint(kind),
      payload: {
        active: form.active,
        allowPreOrder: form.allowPreOrder,
        category: form.category,
        costPrice: form.costPrice,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        name: form.name,
        price: form.price,
        stock: form.stock,
      },
    };
  }

  if (kind === "plan") {
    return {
      endpoint: catalogEndpoint(kind),
      payload: {
        active: form.active,
        benefits: form.benefits
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        description: form.description || null,
        highlighted: form.highlighted,
        name: form.name,
        price: form.price,
      },
    };
  }

  return {
    endpoint: catalogEndpoint(kind),
    payload: {
      active: form.active,
      discountValue: form.discountValue || null,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      name: form.name,
      productId: form.productId || null,
      requiredPoints: form.requiredPoints,
      rewardType: form.rewardType,
      serviceId: form.serviceId || null,
    },
  };
}

function toCatalogForm(
  kind: CatalogKind,
  item?: Plan | Product | Reward | Service,
): CatalogForm {
  if (!item) {
    return emptyCatalogForm;
  }

  const base = {
    ...emptyCatalogForm,
    active: item.active,
    description: item.description ?? "",
    name: item.name,
  };

  if (kind === "service") {
    const service = item as Service;
    return {
      ...base,
      durationLabel: service.durationLabel ?? "",
      durationMinutes: String(service.durationMinutes),
      imageUrl: service.imageUrl ?? "",
      price: service.price,
    };
  }

  if (kind === "product") {
    const product = item as Product;
    return {
      ...base,
      allowPreOrder: product.allowPreOrder,
      category: product.category,
      costPrice: product.costPrice,
      imageUrl: product.imageUrl ?? "",
      price: product.price,
      stock: String(product.stock),
    };
  }

  if (kind === "plan") {
    const plan = item as Plan;
    return {
      ...base,
      benefits: plan.benefits.join("\n"),
      highlighted: plan.highlighted,
      price: plan.price,
    };
  }

  const reward = item as Reward;
  return {
    ...base,
    discountValue: reward.discountValue ?? "",
    imageUrl: reward.imageUrl ?? "",
    productId: reward.productId ?? "",
    requiredPoints: String(reward.requiredPoints),
    rewardType: reward.rewardType,
    serviceId: reward.serviceId ?? "",
  };
}

function toTeamForm(professional?: Professional): TeamForm {
  if (!professional) {
    return emptyTeamForm;
  }

  return {
    active: professional.active,
    birthDate: dateKey(professional.user?.birthDate),
    commissionPercent: professional.commissionPercent,
    email: professional.user?.email ?? "",
    name: professional.user?.name ?? "",
    online: professional.online,
    password: "",
    phone: professional.user?.phone ?? "",
    specialty: professional.specialty,
  };
}

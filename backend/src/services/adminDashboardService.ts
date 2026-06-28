import {
  AppointmentStatus,
  ClientPlanStatus,
  PaymentStatus,
  ProductOrderStatus,
  Role,
} from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { publicUser } from "../utils/publicUser.js";

type Period = "today" | "week" | "month" | "last30" | "custom";

type DashboardQuery = {
  endDate?: string;
  period?: Period;
  startDate?: string;
};

type ReportQuery = DashboardQuery & {
  barberId?: string;
  paymentMethod?: string;
  serviceId?: string;
  status?: string;
};

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function endOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function dateKey(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

function parseDate(value: string) {
  return startOfDay(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function resolveRange(query: DashboardQuery) {
  const now = new Date();
  const period = query.period ?? "month";

  if (period === "custom" && query.startDate && query.endDate) {
    return {
      end: endOfDay(parseDate(query.endDate)),
      start: startOfDay(parseDate(query.startDate)),
    };
  }

  if (period === "today") {
    return { end: endOfDay(now), start: startOfDay(now) };
  }

  if (period === "week") {
    return { end: endOfDay(now), start: addDays(startOfDay(now), -6) };
  }

  if (period === "last30") {
    return { end: endOfDay(now), start: addDays(startOfDay(now), -29) };
  }

  return {
    end: endOfDay(now),
    start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
  };
}

function money(value: unknown) {
  return Number(value ?? 0);
}

function sum<T>(items: T[], mapper: (item: T) => number) {
  return items.reduce<number>((total, item) => total + mapper(item), 0);
}

function daysBetween(start: Date, end: Date) {
  const days: string[] = [];
  const cursor = startOfDay(start);

  while (cursor <= end) {
    days.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function groupCount<T>(items: T[], keyFactory: (item: T) => string) {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = keyFactory(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function statusCount<T extends { status: string }>(items: T[]) {
  return groupCount(items, (item) => item.status);
}

function serializeUser(user: any) {
  return user ? publicUser(user) : undefined;
}

async function baseData(query: DashboardQuery) {
  const { end, start } = resolveRange(query);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    appointments,
    todayAppointments,
    payments,
    pendingPayments,
    users,
    newClients,
    activePlans,
    pendingPlans,
    pendingOrders,
    lowStockProducts,
    recentPayments,
    upcomingAppointments,
    products,
    professionals,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: start, lte: end } },
      include: { client: true, payment: true, professional: { include: { user: true } }, service: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.appointment.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { client: true, payment: true, professional: { include: { user: true } }, service: true },
    }),
    prisma.payment.findMany({
      where: { status: PaymentStatus.PAID, createdAt: { gte: start, lte: end } },
      include: { appointment: { include: { professional: { include: { user: true } }, service: true } }, client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.AWAITING_CONFIRMATION] },
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.user.findMany({ where: { role: Role.CLIENT } }),
    prisma.user.findMany({ where: { role: Role.CLIENT, createdAt: { gte: start, lte: end } } }),
    prisma.clientPlan.findMany({ where: { status: ClientPlanStatus.ACTIVE }, include: { client: true, plan: true } }),
    prisma.clientPlan.findMany({
      where: { status: ClientPlanStatus.PENDING },
      include: { client: true, plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productOrder.findMany({
      where: {
        status: {
          in: [
            ProductOrderStatus.PRE_ORDER_REQUESTED,
            ProductOrderStatus.UNDER_REVIEW,
            ProductOrderStatus.ORDERED,
            ProductOrderStatus.AVAILABLE_FOR_PICKUP,
          ],
        },
      },
      include: { client: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ where: { active: true, stock: { lte: 3 } }, orderBy: { stock: "asc" } }),
    prisma.payment.findMany({
      take: 8,
      include: { appointment: { include: { service: true } }, client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appointment.findMany({
      take: 8,
      where: { date: { gte: todayStart }, status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] } },
      include: { client: true, professional: { include: { user: true } }, service: true, payment: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.product.findMany({ where: { active: true } }),
    prisma.professional.findMany({ where: { active: true }, include: { user: true } }),
  ]);

  return {
    activePlans,
    appointments,
    end,
    lowStockProducts,
    newClients,
    payments,
    pendingOrders,
    pendingPayments,
    pendingPlans,
    products,
    professionals,
    recentPayments,
    start,
    todayAppointments,
    upcomingAppointments,
    users,
  };
}

export const adminDashboardService = {
  async dashboard(query: DashboardQuery) {
    const data = await baseData(query);
    const paidRevenue = sum(data.payments, (payment) => money(payment.amount));
    const pendingRevenue = sum(data.pendingPayments, (payment) => money(payment.amount));
    const finishedAppointments = data.appointments.filter(
      (appointment) => appointment.status === AppointmentStatus.FINISHED,
    );
    const canceledAppointments = data.appointments.filter(
      (appointment) => appointment.status === AppointmentStatus.CANCELED,
    );
    const ticketAverage = data.payments.length ? paidRevenue / data.payments.length : 0;
    const capacity = Math.max(data.professionals.length * daysBetween(data.start, data.end).length * 18, 1);
    const occupied = data.appointments.filter(
      (appointment) => appointment.status !== AppointmentStatus.CANCELED,
    ).length;

    const dayKeys = daysBetween(data.start, data.end);
    const revenueByDay = dayKeys.map((day) => ({
      date: day,
      total: sum(data.payments.filter((payment) => dateKey(payment.createdAt) === day), (payment) => money(payment.amount)),
    }));
    const appointmentsByDay = dayKeys.map((day) => ({
      date: day,
      total: data.appointments.filter((appointment) => dateKey(appointment.date) === day).length,
    }));

    return {
      cards: {
        appointmentsInPeriod: data.appointments.length,
        appointmentsToday: data.todayAppointments.length,
        averageTicket: ticketAverage,
        cancellationRate: data.appointments.length
          ? Math.round((canceledAppointments.length / data.appointments.length) * 100)
          : 0,
        clients: data.users.length,
        lowStockProducts: data.lowStockProducts.length,
        newClients: data.newClients.length,
        occupancyRate: Math.round((occupied / capacity) * 100),
        paidRevenue,
        pendingOrders: data.pendingOrders.length,
        pendingPlans: data.pendingPlans.length,
        pendingRevenue,
        activePlans: data.activePlans.length,
        finishedAppointments: finishedAppointments.length,
      },
      revenueByDay,
      appointmentsByDay,
      appointmentsByStatus: statusCount(data.appointments),
      paymentsByMethod: groupCount(data.payments, (payment) => payment.method),
      topServices: groupCount(data.appointments, (appointment) => appointment.service?.name ?? "Servico").slice(0, 8),
      revenueByProfessional: groupCount(data.payments, (payment) => payment.appointment?.professional?.user?.name ?? "Profissional")
        .map((item) => ({
          ...item,
          total: sum(
            data.payments.filter(
              (payment) => (payment.appointment?.professional?.user?.name ?? "Profissional") === item.name,
            ),
            (payment) => money(payment.amount),
          ),
        }))
        .slice(0, 8),
      upcomingAppointments: data.upcomingAppointments.map((appointment) => ({
        ...appointment,
        client: serializeUser(appointment.client),
      })),
      recentPayments: data.recentPayments.map((payment) => ({
        ...payment,
        client: serializeUser(payment.client),
      })),
      pendingPlans: data.pendingPlans.map((plan) => ({
        ...plan,
        client: serializeUser(plan.client),
      })),
      pendingOrders: data.pendingOrders.map((order) => ({
        ...order,
        client: serializeUser(order.client),
      })),
      lowStockProducts: data.lowStockProducts,
    };
  },

  async report(kind: "appointments" | "financial" | "clients" | "products" | "plans", query: ReportQuery) {
    const { end, start } = resolveRange(query);

    if (kind === "appointments") {
      const where: any = { date: { gte: start, lte: end } };
      if (query.barberId) where.professionalId = query.barberId;
      if (query.serviceId) where.serviceId = query.serviceId;
      if (query.status) where.status = query.status;

      const rows = await prisma.appointment.findMany({
        where,
        include: { client: true, payment: true, professional: { include: { user: true } }, service: true },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
      });

      return { rows: rows.map((row) => ({ ...row, client: serializeUser(row.client) })), totals: { count: rows.length } };
    }

    if (kind === "financial") {
      const where: any = { createdAt: { gte: start, lte: end } };
      if (query.paymentMethod) where.method = query.paymentMethod;
      if (query.status) where.status = query.status;

      const rows = await prisma.payment.findMany({
        where,
        include: { appointment: { include: { professional: { include: { user: true } }, service: true } }, client: true },
        orderBy: { createdAt: "desc" },
      });

      return {
        rows: rows.map((row) => ({ ...row, client: serializeUser(row.client) })),
        totals: {
          count: rows.length,
          paid: sum(rows.filter((row) => row.status === PaymentStatus.PAID), (row) => money(row.amount)),
          pending: sum(rows.filter((row) => row.status !== PaymentStatus.PAID), (row) => money(row.amount)),
        },
      };
    }

    if (kind === "clients") {
      const rows = await prisma.user.findMany({
        where: { role: Role.CLIENT, createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: "desc" },
      });

      return { rows: rows.map(serializeUser), totals: { count: rows.length } };
    }

    if (kind === "products") {
      const where: any = { createdAt: { gte: start, lte: end } };
      if (query.status) where.status = query.status;

      const rows = await prisma.productOrder.findMany({
        where,
        include: { client: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      });

      return {
        rows: rows.map((row) => ({ ...row, client: serializeUser(row.client) })),
        totals: { count: rows.length, total: sum(rows, (row) => money(row.total)) },
      };
    }

    const where: any = { createdAt: { gte: start, lte: end } };
    if (query.status) where.status = query.status;

    const rows = await prisma.clientPlan.findMany({
      where,
      include: { client: true, plan: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      rows: rows.map((row) => ({ ...row, client: serializeUser(row.client) })),
      totals: { count: rows.length, active: rows.filter((row) => row.status === ClientPlanStatus.ACTIVE).length },
    };
  },
};

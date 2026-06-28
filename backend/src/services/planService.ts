import {
  ClientPlanStatus,
  PaymentStatus,
  Role,
  type ClientPlan,
} from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import { publicUser } from "../utils/publicUser.js";
import type {
  CreatePlanData,
  PlanPaymentLinkData,
  SubscribePlanData,
  UpdatePlanData,
} from "../validations/planValidation.js";

type ListFilters = {
  active?: boolean;
};

type Actor = {
  id: string;
  role: Role;
};

type ReceiptData = {
  receiptFileName: string;
  receiptUrl: string;
};

type ClientPlanWithRelations = ClientPlan & {
  client?: Parameters<typeof publicUser>[0];
  plan?: unknown;
};

const clientPlanInclude = {
  client: true,
  plan: true,
};

function safeClientPlan(clientPlan: ClientPlanWithRelations) {
  const { client, ...clientPlanData } = clientPlan;

  return {
    ...clientPlanData,
    client: client ? publicUser(client) : undefined,
  };
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

async function markExpiredPlans() {
  await prisma.clientPlan.updateMany({
    where: {
      status: ClientPlanStatus.ACTIVE,
      endDate: {
        lt: new Date(),
      },
    },
    data: {
      status: ClientPlanStatus.EXPIRED,
    },
  });
}

export const planService = {
  async list(actor: Actor, filters: ListFilters) {
    return prisma.plan.findMany({
      where:
        actor.role === Role.ADMIN
          ? filters.active === undefined
            ? undefined
            : { active: filters.active }
          : { active: true },
      orderBy: { price: "asc" },
    });
  },

  async getById(id: string, actor?: Actor) {
    const plan = await prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      throw new AppError("Plano nao encontrado.", 404);
    }

    if (actor && actor.role !== Role.ADMIN && !plan.active) {
      throw new AppError("Plano nao encontrado.", 404);
    }

    return plan;
  },

  async create(data: CreatePlanData) {
    const existingPlan = await prisma.plan.findUnique({
      where: { name: data.name },
    });

    if (existingPlan) {
      throw new AppError("Ja existe um plano com este nome.", 409);
    }

    return prisma.plan.create({
      data: {
        ...data,
        active: data.active ?? true,
        highlighted: data.highlighted ?? false,
      },
    });
  },

  async update(id: string, data: UpdatePlanData) {
    await this.getById(id);

    if (data.name) {
      const existingPlan = await prisma.plan.findUnique({
        where: { name: data.name },
      });

      if (existingPlan && existingPlan.id !== id) {
        throw new AppError("Ja existe um plano com este nome.", 409);
      }
    }

    return prisma.plan.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.getById(id);

    return prisma.plan.update({
      where: { id },
      data: { active: false },
    });
  },

  async listSubscriptions(actor: Actor) {
    if (actor.role === Role.PROFESSIONAL) {
      throw new AppError("Profissionais nao podem acessar assinaturas.", 403);
    }

    await markExpiredPlans();

    const subscriptions = await prisma.clientPlan.findMany({
      where: actor.role === Role.ADMIN ? undefined : { clientId: actor.id },
      include: clientPlanInclude,
      orderBy: { createdAt: "desc" },
    });

    return subscriptions.map(safeClientPlan);
  },

  async getCurrentSubscription(actor: Actor) {
    if (actor.role !== Role.CLIENT) {
      throw new AppError("Apenas clientes possuem plano atual.", 403);
    }

    await markExpiredPlans();

    const subscription = await prisma.clientPlan.findFirst({
      where: {
        clientId: actor.id,
        status: {
          in: [
            ClientPlanStatus.ACTIVE,
            ClientPlanStatus.PENDING,
            ClientPlanStatus.EXPIRED,
          ],
        },
      },
      include: clientPlanInclude,
      orderBy: { createdAt: "desc" },
    });

    return subscription ? safeClientPlan(subscription) : null;
  },

  async subscribe(actor: Actor, planId: string, data: SubscribePlanData) {
    if (actor.role !== Role.CLIENT) {
      throw new AppError("Apenas clientes podem solicitar assinatura.", 403);
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (!plan || !plan.active) {
      throw new AppError("Plano invalido ou inativo.", 404);
    }

    const existingSubscription = await prisma.clientPlan.findFirst({
      where: {
        clientId: actor.id,
        status: {
          in: [ClientPlanStatus.PENDING, ClientPlanStatus.ACTIVE],
        },
      },
    });

    if (existingSubscription?.status === ClientPlanStatus.ACTIVE) {
      throw new AppError("Voce ja possui um plano ativo.");
    }

    if (existingSubscription?.status === ClientPlanStatus.PENDING) {
      throw new AppError("Voce ja possui uma solicitacao de plano aguardando confirmacao.");
    }

    const subscription = await prisma.clientPlan.create({
      data: {
        clientId: actor.id,
        planId,
        paymentStatus: data.paymentStatus ?? PaymentStatus.AWAITING_CONFIRMATION,
        status: ClientPlanStatus.PENDING,
      },
      include: clientPlanInclude,
    });

    return safeClientPlan(subscription);
  },

  async updateSubscriptionPaymentLink(
    actor: Actor,
    id: string,
    data: PlanPaymentLinkData,
  ) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Somente administradores podem cadastrar link de pagamento.", 403);
    }

    const subscription = await prisma.clientPlan.findUnique({ where: { id } });

    if (!subscription) {
      throw new AppError("Solicitacao de plano nao encontrada.", 404);
    }

    const updatedSubscription = await prisma.clientPlan.update({
      where: { id },
      data: {
        infinityPayUrl: data.infinityPayUrl || null,
      },
      include: clientPlanInclude,
    });

    return safeClientPlan(updatedSubscription);
  },

  async uploadSubscriptionReceipt(actor: Actor, id: string, data: ReceiptData) {
    const subscription = await prisma.clientPlan.findUnique({
      where: { id },
      include: clientPlanInclude,
    });

    if (!subscription) {
      throw new AppError("Solicitacao de plano nao encontrada.", 404);
    }

    if (actor.role !== Role.ADMIN && subscription.clientId !== actor.id) {
      throw new AppError("Voce nao pode enviar comprovante para este plano.", 403);
    }

    if (
      actor.role === Role.CLIENT &&
      (subscription.status === ClientPlanStatus.ACTIVE ||
        subscription.status === ClientPlanStatus.CANCELED ||
        subscription.paymentStatus === PaymentStatus.PAID)
    ) {
      throw new AppError("Este plano nao aceita novo comprovante.", 403);
    }

    const updatedSubscription = await prisma.clientPlan.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.AWAITING_CONFIRMATION,
        receiptFileName: data.receiptFileName,
        receiptUploadedAt: new Date(),
        receiptUrl: data.receiptUrl,
      },
      include: clientPlanInclude,
    });

    return safeClientPlan(updatedSubscription);
  },

  async approveSubscription(actor: Actor, id: string) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Somente administradores podem aprovar planos.", 403);
    }

    await markExpiredPlans();

    const currentSubscription = await prisma.clientPlan.findUnique({
      where: { id },
      include: { client: true, plan: true },
    });

    if (!currentSubscription) {
      throw new AppError("Solicitacao de plano nao encontrada.", 404);
    }

    if (currentSubscription.client.role !== Role.CLIENT || !currentSubscription.client.active) {
      throw new AppError("Cliente invalido ou inativo.");
    }

    const activeSubscription = await prisma.clientPlan.findFirst({
      where: {
        clientId: currentSubscription.clientId,
        id: { not: id },
        status: ClientPlanStatus.ACTIVE,
      },
    });

    if (activeSubscription) {
      throw new AppError("Este cliente ja possui um plano ativo.");
    }

    const startDate = new Date();
    const endDate = addDays(startDate, 30);

    const subscription = await prisma.clientPlan.update({
      where: { id },
      data: {
        confirmedAt: new Date(),
        confirmedById: actor.id,
        endDate,
        paymentStatus: PaymentStatus.PAID,
        startDate,
        status: ClientPlanStatus.ACTIVE,
      },
      include: clientPlanInclude,
    });

    return safeClientPlan(subscription);
  },

  async cancelSubscription(actor: Actor, id: string) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Somente administradores podem cancelar planos.", 403);
    }

    const subscription = await prisma.clientPlan.findUnique({ where: { id } });

    if (!subscription) {
      throw new AppError("Assinatura nao encontrada.", 404);
    }

    const canceledSubscription = await prisma.clientPlan.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.CANCELED,
        status: ClientPlanStatus.CANCELED,
      },
      include: clientPlanInclude,
    });

    return safeClientPlan(canceledSubscription);
  },

  async renewSubscription(actor: Actor, id: string) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Somente administradores podem renovar planos.", 403);
    }

    await markExpiredPlans();

    const currentSubscription = await prisma.clientPlan.findUnique({
      where: { id },
    });

    if (!currentSubscription) {
      throw new AppError("Assinatura nao encontrada.", 404);
    }

    const activeSubscription = await prisma.clientPlan.findFirst({
      where: {
        clientId: currentSubscription.clientId,
        id: { not: id },
        status: ClientPlanStatus.ACTIVE,
      },
    });

    if (activeSubscription) {
      throw new AppError("Este cliente ja possui outro plano ativo.");
    }

    const baseDate =
      currentSubscription.endDate && currentSubscription.endDate > new Date()
        ? currentSubscription.endDate
        : new Date();
    const startDate = currentSubscription.startDate ?? new Date();
    const endDate = addDays(baseDate, 30);

    const subscription = await prisma.clientPlan.update({
      where: { id },
      data: {
        confirmedAt: new Date(),
        confirmedById: actor.id,
        endDate,
        paymentStatus: PaymentStatus.PAID,
        startDate,
        status: ClientPlanStatus.ACTIVE,
      },
      include: clientPlanInclude,
    });

    return safeClientPlan(subscription);
  },
};

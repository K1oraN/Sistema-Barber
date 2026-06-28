import { PaymentStatus, Role, type Payment } from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import { publicUser } from "../utils/publicUser.js";
import type {
  CreatePaymentData,
  PaymentLinkData,
  UpdatePaymentData,
} from "../validations/paymentValidation.js";

type Actor = {
  id: string;
  role: Role;
};

type ReceiptData = {
  receiptFileName: string;
  receiptUrl: string;
};

type PaymentWithRelations = Payment & {
  client?: Parameters<typeof publicUser>[0];
  appointment?: {
    professionalId: string;
    clientId: string;
    professional?: {
      userId: string;
    };
  };
};

const paymentInclude = {
  client: true,
  appointment: {
    include: {
      professional: true,
      service: true,
    },
  },
};

function safePayment(payment: PaymentWithRelations) {
  const { client, ...paymentData } = payment;

  return {
    ...paymentData,
    client: client ? publicUser(client) : undefined,
  };
}

async function ensurePaymentAccess(actor: Actor, payment: PaymentWithRelations) {
  if (actor.role === Role.ADMIN) {
    return;
  }

  if (actor.role === Role.CLIENT && payment.clientId === actor.id) {
    return;
  }

  if (
    actor.role === Role.PROFESSIONAL &&
    payment.appointment?.professional?.userId === actor.id
  ) {
    return;
  }

  throw new AppError("Voce nao pode acessar este pagamento.", 403);
}

export const paymentService = {
  async list(actor: Actor) {
    if (actor.role === Role.ADMIN) {
      const payments = await prisma.payment.findMany({
        include: paymentInclude,
        orderBy: { createdAt: "desc" },
      });

      return payments.map(safePayment);
    }

    if (actor.role === Role.CLIENT) {
      const payments = await prisma.payment.findMany({
        where: { clientId: actor.id },
        include: paymentInclude,
        orderBy: { createdAt: "desc" },
      });

      return payments.map(safePayment);
    }

    const payments = await prisma.payment.findMany({
      where: {
        appointment: {
          professional: {
            userId: actor.id,
          },
        },
      },
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
    });

    return payments.map(safePayment);
  },

  async getById(actor: Actor, id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });

    if (!payment) {
      throw new AppError("Pagamento nao encontrado.", 404);
    }

    await ensurePaymentAccess(actor, payment);

    return safePayment(payment);
  },

  async create(actor: Actor, data: CreatePaymentData) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: { professional: true },
    });

    if (!appointment) {
      throw new AppError("Agendamento nao encontrado.", 404);
    }

    if (actor.role === Role.CLIENT && appointment.clientId !== actor.id) {
      throw new AppError("Voce so pode pagar seus proprios agendamentos.", 403);
    }

    if (
      actor.role === Role.PROFESSIONAL &&
      appointment.professional.userId !== actor.id
    ) {
      throw new AppError("Voce so pode registrar pagamentos da sua agenda.", 403);
    }

    const clientId = data.clientId ?? appointment.clientId;

    if (clientId !== appointment.clientId) {
      throw new AppError("Cliente do pagamento deve ser o cliente do agendamento.");
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { appointmentId: data.appointmentId },
    });

    if (existingPayment) {
      throw new AppError("Este agendamento ja possui pagamento.", 409);
    }

    if (actor.role === Role.CLIENT && data.status) {
      throw new AppError("Cliente nao pode confirmar pagamento.", 403);
    }

    const status =
      actor.role === Role.CLIENT
        ? data.receiptUrl
          ? PaymentStatus.AWAITING_CONFIRMATION
          : PaymentStatus.PENDING
        : data.status ?? PaymentStatus.PENDING;
    const isConfirmedByTeam =
      actor.role !== Role.CLIENT && status === PaymentStatus.PAID;

    const payment = await prisma.payment.create({
      data: {
        appointmentId: data.appointmentId,
        clientId,
        amount: actor.role === Role.CLIENT ? appointment.totalValue : data.amount,
        confirmationNote: data.confirmationNote,
        confirmedAt: isConfirmedByTeam ? new Date() : undefined,
        confirmedById: isConfirmedByTeam ? actor.id : undefined,
        method: data.method,
        status,
        infinityPayUrl: data.infinityPayUrl,
        receiptFileName: data.receiptFileName,
        receiptUploadedAt: data.receiptUrl ? new Date() : undefined,
        receiptUrl: data.receiptUrl,
      },
      include: paymentInclude,
    });

    return safePayment(payment);
  },

  async update(actor: Actor, id: string, data: UpdatePaymentData) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });

    if (!payment) {
      throw new AppError("Pagamento nao encontrado.", 404);
    }

    await ensurePaymentAccess(actor, payment);

    if (actor.role === Role.CLIENT) {
      if (data.amount !== undefined) {
        throw new AppError("Cliente nao pode alterar o valor do pagamento.", 403);
      }

      if (data.status) {
        throw new AppError("Cliente nao pode alterar o status do pagamento.", 403);
      }

      if (data.confirmationNote) {
        throw new AppError("Cliente nao pode registrar observacao de confirmacao.", 403);
      }

      if (payment.status === PaymentStatus.PAID) {
        throw new AppError("Este pagamento ja foi confirmado pela equipe.", 403);
      }
    }

    const updatedData =
      actor.role === Role.CLIENT
        ? {
            method: data.method,
            receiptFileName: data.receiptFileName,
            receiptUploadedAt: data.receiptUrl ? new Date() : undefined,
            receiptUrl: data.receiptUrl,
            status: data.receiptUrl
              ? PaymentStatus.AWAITING_CONFIRMATION
              : undefined,
          }
        : {
            ...data,
            confirmedAt:
              data.status === PaymentStatus.PAID
                ? payment.confirmedAt ?? new Date()
                : undefined,
            confirmedById:
              data.status === PaymentStatus.PAID
                ? payment.confirmedById ?? actor.id
                : undefined,
            receiptUploadedAt: data.receiptUrl ? new Date() : undefined,
          };

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updatedData,
      include: paymentInclude,
    });

    return safePayment(updatedPayment);
  },

  async updatePaymentLink(actor: Actor, id: string, data: PaymentLinkData) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Somente administradores podem cadastrar link de pagamento.", 403);
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });

    if (!payment) {
      throw new AppError("Pagamento nao encontrado.", 404);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        infinityPayUrl: data.infinityPayUrl || null,
        method: data.infinityPayUrl ? "CARD" : payment.method,
      },
      include: paymentInclude,
    });

    return safePayment(updatedPayment);
  },

  async uploadReceipt(actor: Actor, id: string, data: ReceiptData) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });

    if (!payment) {
      throw new AppError("Pagamento nao encontrado.", 404);
    }

    await ensurePaymentAccess(actor, payment);

    if (actor.role === Role.CLIENT && payment.status === PaymentStatus.PAID) {
      throw new AppError("Este pagamento ja foi confirmado pela equipe.", 403);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        receiptFileName: data.receiptFileName,
        receiptUploadedAt: new Date(),
        receiptUrl: data.receiptUrl,
        status:
          actor.role === Role.CLIENT
            ? PaymentStatus.AWAITING_CONFIRMATION
            : payment.status,
      },
      include: paymentInclude,
    });

    return safePayment(updatedPayment);
  },

  async remove(actor: Actor, id: string) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Somente administradores podem remover pagamentos.", 403);
    }

    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      throw new AppError("Pagamento nao encontrado.", 404);
    }

    await prisma.payment.delete({ where: { id } });

    return { message: "Pagamento removido com sucesso." };
  },
};

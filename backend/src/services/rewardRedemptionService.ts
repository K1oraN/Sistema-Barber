import {
  PaymentStatus,
  ProductOrderStatus,
  ProductOrderType,
  RedemptionStatus,
  RewardType,
  Role,
  type RewardRedemption,
} from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import { publicUser } from "../utils/publicUser.js";
import type {
  CreateRewardRedemptionData,
  UpdateRewardRedemptionData,
} from "../validations/rewardRedemptionValidation.js";

type Actor = {
  id: string;
  role: Role;
};

type RedemptionWithRelations = RewardRedemption & {
  client?: Parameters<typeof publicUser>[0];
  reward?: unknown;
};

const redemptionInclude = {
  client: true,
  productOrder: {
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  },
  reward: {
    include: {
      product: true,
      service: true,
    },
  },
};

function safeRedemption(redemption: RedemptionWithRelations) {
  const { client, ...redemptionData } = redemption;

  return {
    ...redemptionData,
    client: client ? publicUser(client) : undefined,
  };
}

function ensureRedemptionAccess(actor: Actor, redemption: RewardRedemption) {
  if (actor.role === Role.ADMIN) {
    return;
  }

  if (actor.role === Role.CLIENT && redemption.clientId === actor.id) {
    return;
  }

  throw new AppError("Voce nao pode acessar este resgate.", 403);
}

function availableStock(product: { reservedStock: number; stock: number }) {
  return product.stock - product.reservedStock;
}

function rewardCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

async function cancelLinkedProductOrder(transaction: any, productOrderId?: string | null) {
  if (!productOrderId) {
    return;
  }

  const productOrder = await transaction.productOrder.findUnique({
    where: { id: productOrderId },
    include: { items: true },
  });

  if (!productOrder || productOrder.status === ProductOrderStatus.CANCELED) {
    return;
  }

  if (
    productOrder.status === ProductOrderStatus.RESERVED ||
    productOrder.status === ProductOrderStatus.AVAILABLE_FOR_PICKUP
  ) {
    for (const item of productOrder.items) {
      await transaction.product.update({
        where: { id: item.productId },
        data: {
          reservedStock: {
            decrement: item.quantity,
          },
        },
      });
    }
  }

  await transaction.productOrder.update({
    where: { id: productOrderId },
    data: {
      paymentStatus:
        productOrder.paymentStatus === PaymentStatus.PAID
          ? productOrder.paymentStatus
          : PaymentStatus.CANCELED,
      status: ProductOrderStatus.CANCELED,
    },
  });
}

export const rewardRedemptionService = {
  async list(actor: Actor) {
    const redemptions = await prisma.rewardRedemption.findMany({
      where: actor.role === Role.ADMIN ? undefined : { clientId: actor.id },
      include: redemptionInclude,
      orderBy: { createdAt: "desc" },
    });

    return redemptions.map(safeRedemption);
  },

  async getById(actor: Actor, id: string) {
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id },
      include: redemptionInclude,
    });

    if (!redemption) {
      throw new AppError("Resgate nao encontrado.", 404);
    }

    ensureRedemptionAccess(actor, redemption);

    return safeRedemption(redemption);
  },

  async create(actor: Actor, data: CreateRewardRedemptionData) {
    const clientId = actor.role === Role.CLIENT ? actor.id : data.clientId;

    if (!clientId) {
      throw new AppError("Informe o cliente do resgate.");
    }

    if (actor.role === Role.PROFESSIONAL) {
      throw new AppError("Profissionais nao podem criar resgates.", 403);
    }

    const reward = await prisma.reward.findUnique({
      where: { id: data.rewardId },
      include: {
        product: true,
        service: true,
      },
    });

    if (!reward || !reward.active) {
      throw new AppError("Premio invalido ou inativo.", 404);
    }

    const client = await prisma.user.findUnique({ where: { id: clientId } });

    if (!client || client.role !== Role.CLIENT || !client.active) {
      throw new AppError("Cliente invalido ou inativo.");
    }

    if (client.points < reward.requiredPoints) {
      throw new AppError("Pontos insuficientes para resgatar este premio.");
    }

    const redemption = await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: clientId },
        data: {
          points: {
            decrement: reward.requiredPoints,
          },
        },
      });

      let code: string | undefined;
      let productOrderId: string | undefined;

      if (
        reward.rewardType === RewardType.PRODUCT ||
        reward.rewardType === RewardType.GIFT
      ) {
        if (!reward.product || !reward.product.active) {
          throw new AppError("Produto indisponivel no momento.");
        }

        const quantity = 1;
        const canReserve = availableStock(reward.product) >= quantity;
        const total = "0.00";

        if (!canReserve && !reward.product.allowPreOrder) {
          throw new AppError("Produto indisponivel no momento.");
        }

        if (canReserve) {
          await transaction.product.update({
            where: { id: reward.product.id },
            data: {
              reservedStock: {
                increment: quantity,
              },
            },
          });
        }

        const productOrder = await transaction.productOrder.create({
          data: {
            clientId,
            notes: `Resgate de premio: ${reward.name}`,
            orderType: canReserve
              ? ProductOrderType.RESERVATION
              : ProductOrderType.PRE_ORDER,
            paymentStatus: PaymentStatus.PAID,
            status: canReserve
              ? ProductOrderStatus.AVAILABLE_FOR_PICKUP
              : ProductOrderStatus.PRE_ORDER_REQUESTED,
            total,
            items: {
              create: {
                productId: reward.product.id,
                quantity,
                subtotal: total,
                unitPrice: "0.00",
              },
            },
          },
        });

        productOrderId = productOrder.id;
      } else {
        code = rewardCode(reward.rewardType === RewardType.DISCOUNT ? "DESC" : "SERV");
      }

      return transaction.rewardRedemption.create({
        data: {
          code,
          clientId,
          productOrderId,
          rewardId: data.rewardId,
          pointsUsed: reward.requiredPoints,
          status: RedemptionStatus.APPROVED,
        },
        include: redemptionInclude,
      });
    });

    return safeRedemption(redemption);
  },

  async update(actor: Actor, id: string, data: UpdateRewardRedemptionData) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Somente administradores podem alterar resgates.", 403);
    }

    const currentRedemption = await prisma.rewardRedemption.findUnique({
      where: { id },
      include: {
        productOrder: true,
      },
    });

    if (!currentRedemption) {
      throw new AppError("Resgate nao encontrado.", 404);
    }

    const redemption = await prisma.$transaction(async (transaction) => {
      if (
        data.status === RedemptionStatus.CANCELED &&
        currentRedemption.status !== RedemptionStatus.CANCELED
      ) {
        await transaction.user.update({
          where: { id: currentRedemption.clientId },
          data: {
            points: {
              increment: currentRedemption.pointsUsed,
            },
          },
        });

        await cancelLinkedProductOrder(transaction, currentRedemption.productOrderId);
      }

      return transaction.rewardRedemption.update({
        where: { id },
        data,
        include: redemptionInclude,
      });
    });

    return safeRedemption(redemption);
  },

  async remove(actor: Actor, id: string) {
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id },
      include: {
        productOrder: true,
      },
    });

    if (!redemption) {
      throw new AppError("Resgate nao encontrado.", 404);
    }

    ensureRedemptionAccess(actor, redemption);

    if (redemption.status !== RedemptionStatus.PENDING && actor.role !== Role.ADMIN) {
      throw new AppError("Apenas resgates pendentes podem ser cancelados.");
    }

    const canceledRedemption = await prisma.$transaction(async (transaction) => {
      if (redemption.status !== RedemptionStatus.CANCELED) {
        await transaction.user.update({
          where: { id: redemption.clientId },
          data: {
            points: {
              increment: redemption.pointsUsed,
            },
          },
        });

        await cancelLinkedProductOrder(transaction, redemption.productOrderId);
      }

      return transaction.rewardRedemption.update({
        where: { id },
        data: { status: RedemptionStatus.CANCELED },
        include: redemptionInclude,
      });
    });

    return safeRedemption(canceledRedemption);
  },
};

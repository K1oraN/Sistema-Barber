import {
  PaymentStatus,
  ProductOrderStatus,
  ProductOrderType,
  Role,
  type Product,
  type ProductOrder,
  type ProductOrderItem,
} from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import { publicUser } from "../utils/publicUser.js";
import type {
  CreateProductOrderData,
  ProductOrderPaymentLinkData,
  ProductOrderQueryData,
  UpdateProductOrderData,
} from "../validations/productOrderValidation.js";

type Actor = {
  id: string;
  role: Role;
};

type ReceiptData = {
  receiptFileName: string;
  receiptUrl: string;
};

type ProductOrderWithRelations = ProductOrder & {
  client?: Parameters<typeof publicUser>[0];
  items?: Array<ProductOrderItem & { product?: Product }>;
  rewardRedemption?: unknown;
};

const productOrderInclude = {
  client: true,
  items: {
    include: {
      product: true,
    },
  },
  rewardRedemption: {
    include: {
      reward: true,
    },
  },
};

function safeProductOrder(order: ProductOrderWithRelations) {
  const { client, ...orderData } = order;

  return {
    ...orderData,
    client: client ? publicUser(client) : undefined,
  };
}

function availableStock(product: Product) {
  return product.stock - product.reservedStock;
}

function orderKeepsReservedStock(order: ProductOrderWithRelations) {
  const statusesWithReservedStock: ProductOrderStatus[] = [
    ProductOrderStatus.RESERVED,
    ProductOrderStatus.AVAILABLE_FOR_PICKUP,
  ];

  return statusesWithReservedStock.includes(order.status);
}

function orderTotal(product: Product, quantity: number) {
  return (Number(product.price) * quantity).toFixed(2);
}

async function ensureProductOrderAccess(
  actor: Actor,
  order: ProductOrderWithRelations,
) {
  if (actor.role === Role.ADMIN || actor.role === Role.PROFESSIONAL) {
    return;
  }

  if (actor.role === Role.CLIENT && order.clientId === actor.id) {
    return;
  }

  throw new AppError("Voce nao pode acessar este pedido.", 403);
}

function ensureTeamActor(actor: Actor, message: string) {
  if (actor.role !== Role.ADMIN && actor.role !== Role.PROFESSIONAL) {
    throw new AppError(message, 403);
  }
}

export const productOrderService = {
  async list(actor: Actor, filters: ProductOrderQueryData) {
    const where: any = actor.role === Role.CLIENT ? { clientId: actor.id } : {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.orderType) {
      where.orderType = filters.orderType;
    }

    if (filters.date) {
      const startDate = new Date(`${filters.date.slice(0, 10)}T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      where.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (actor.role !== Role.CLIENT && filters.client) {
      where.client = {
        OR: [
          { name: { contains: filters.client, mode: "insensitive" } },
          { email: { contains: filters.client, mode: "insensitive" } },
          { phone: { contains: filters.client, mode: "insensitive" } },
        ],
      };
    }

    if (filters.product) {
      where.items = {
        some: {
          product: {
            name: { contains: filters.product, mode: "insensitive" },
          },
        },
      };
    }

    const orders = await prisma.productOrder.findMany({
      where,
      include: productOrderInclude,
      orderBy: { createdAt: "desc" },
    });

    return orders.map(safeProductOrder);
  },

  async getById(actor: Actor, id: string) {
    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: productOrderInclude,
    });

    if (!order) {
      throw new AppError("Pedido nao encontrado.", 404);
    }

    await ensureProductOrderAccess(actor, order);

    return safeProductOrder(order);
  },

  async reserve(actor: Actor, data: CreateProductOrderData) {
    if (actor.role !== Role.CLIENT) {
      throw new AppError("Apenas clientes podem reservar produtos.", 403);
    }

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product || !product.active) {
      throw new AppError("Produto invalido ou inativo.", 404);
    }

    if (availableStock(product) < data.quantity) {
      throw new AppError("Nao e permitido reservar quantidade maior que o estoque disponivel.");
    }

    const total = orderTotal(product, data.quantity);

    const order = await prisma.$transaction(async (transaction) => {
      await transaction.product.update({
        where: { id: product.id },
        data: {
          reservedStock: {
            increment: data.quantity,
          },
        },
      });

      return transaction.productOrder.create({
        data: {
          clientId: actor.id,
          notes: data.notes,
          orderType: ProductOrderType.RESERVATION,
          paymentStatus: PaymentStatus.AWAITING_CONFIRMATION,
          status: ProductOrderStatus.RESERVED,
          total,
          items: {
            create: {
              productId: product.id,
              quantity: data.quantity,
              subtotal: total,
              unitPrice: String(product.price),
            },
          },
        },
        include: productOrderInclude,
      });
    });

    return safeProductOrder(order);
  },

  async preOrder(actor: Actor, data: CreateProductOrderData) {
    if (actor.role !== Role.CLIENT) {
      throw new AppError("Apenas clientes podem solicitar encomendas.", 403);
    }

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product || !product.active) {
      throw new AppError("Produto invalido ou inativo.", 404);
    }

    if (!product.allowPreOrder) {
      throw new AppError("Este produto nao permite encomenda.");
    }

    const total = orderTotal(product, data.quantity);

    const order = await prisma.productOrder.create({
      data: {
        clientId: actor.id,
        notes: data.notes,
        orderType: ProductOrderType.PRE_ORDER,
        paymentStatus: PaymentStatus.PENDING,
        status: ProductOrderStatus.PRE_ORDER_REQUESTED,
        total,
        items: {
          create: {
            productId: product.id,
            quantity: data.quantity,
            subtotal: total,
            unitPrice: String(product.price),
          },
        },
      },
      include: productOrderInclude,
    });

    return safeProductOrder(order);
  },

  async update(actor: Actor, id: string, data: UpdateProductOrderData) {
    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: productOrderInclude,
    });

    if (!order) {
      throw new AppError("Pedido nao encontrado.", 404);
    }

    await ensureProductOrderAccess(actor, order);

    if (actor.role === Role.CLIENT) {
      if (data.status || data.paymentStatus || data.paymentMethod || data.notes || data.infinityPayUrl) {
        throw new AppError("Cliente nao pode alterar status, pagamento ou observacoes do pedido.", 403);
      }

      if (
        order.status === ProductOrderStatus.DELIVERED ||
        order.status === ProductOrderStatus.CANCELED ||
        order.paymentStatus === PaymentStatus.PAID
      ) {
        throw new AppError("Este pedido nao aceita novo comprovante.", 403);
      }

      const updatedOrder = await prisma.productOrder.update({
        where: { id },
        data: {
          receiptFileName: data.receiptFileName,
          receiptUploadedAt: data.receiptUrl ? new Date() : undefined,
          receiptUrl: data.receiptUrl,
          paymentStatus: data.receiptUrl
            ? PaymentStatus.AWAITING_CONFIRMATION
            : undefined,
        },
        include: productOrderInclude,
      });

      return safeProductOrder(updatedOrder);
    }

    ensureTeamActor(actor, "Somente equipe pode atualizar pedidos.");

    const updatedOrder = await prisma.$transaction(async (transaction) => {
      if (
        data.status === ProductOrderStatus.AVAILABLE_FOR_PICKUP &&
        !orderKeepsReservedStock(order)
      ) {
        for (const item of order.items ?? []) {
          const product = await transaction.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || availableStock(product) < item.quantity) {
            throw new AppError("Estoque insuficiente para separar este pedido.");
          }

          await transaction.product.update({
            where: { id: item.productId },
            data: {
              reservedStock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      if (data.status === ProductOrderStatus.CANCELED && orderKeepsReservedStock(order)) {
        for (const item of order.items ?? []) {
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

      if (data.status === ProductOrderStatus.DELIVERED) {
        if (!orderKeepsReservedStock(order)) {
          throw new AppError("Separe o produto antes de marcar como entregue.");
        }

        for (const item of order.items ?? []) {
          await transaction.product.update({
            where: { id: item.productId },
            data: {
              reservedStock: {
                decrement: item.quantity,
              },
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      const paymentIsPaid = data.paymentStatus === PaymentStatus.PAID;

      return transaction.productOrder.update({
        where: { id },
        data: {
          notes: data.notes,
          paymentConfirmedAt: paymentIsPaid
            ? order.paymentConfirmedAt ?? new Date()
            : undefined,
          paymentConfirmedById: paymentIsPaid
            ? order.paymentConfirmedById ?? actor.id
            : undefined,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          infinityPayUrl: data.infinityPayUrl,
          status: data.status,
          deliveredAt:
            data.status === ProductOrderStatus.DELIVERED
              ? order.deliveredAt ?? new Date()
              : undefined,
          deliveredById:
            data.status === ProductOrderStatus.DELIVERED
              ? order.deliveredById ?? actor.id
              : undefined,
        },
        include: productOrderInclude,
      });
    });

    return safeProductOrder(updatedOrder);
  },

  async updatePaymentLink(
    actor: Actor,
    id: string,
    data: ProductOrderPaymentLinkData,
  ) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Somente administradores podem cadastrar link de pagamento.", 403);
    }

    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: productOrderInclude,
    });

    if (!order) {
      throw new AppError("Pedido nao encontrado.", 404);
    }

    const updatedOrder = await prisma.productOrder.update({
      where: { id },
      data: {
        infinityPayUrl: data.infinityPayUrl || null,
        paymentMethod: data.infinityPayUrl ? "CARD" : order.paymentMethod,
      },
      include: productOrderInclude,
    });

    return safeProductOrder(updatedOrder);
  },

  async uploadReceipt(actor: Actor, id: string, data: ReceiptData) {
    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: productOrderInclude,
    });

    if (!order) {
      throw new AppError("Pedido nao encontrado.", 404);
    }

    await ensureProductOrderAccess(actor, order);

    if (
      actor.role === Role.CLIENT &&
      (order.status === ProductOrderStatus.DELIVERED ||
        order.status === ProductOrderStatus.CANCELED ||
        order.paymentStatus === PaymentStatus.PAID)
    ) {
      throw new AppError("Este pedido nao aceita novo comprovante.", 403);
    }

    const updatedOrder = await prisma.productOrder.update({
      where: { id },
      data: {
        receiptFileName: data.receiptFileName,
        receiptUploadedAt: new Date(),
        receiptUrl: data.receiptUrl,
        paymentStatus: PaymentStatus.AWAITING_CONFIRMATION,
      },
      include: productOrderInclude,
    });

    return safeProductOrder(updatedOrder);
  },

  async cancel(actor: Actor, id: string) {
    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: productOrderInclude,
    });

    if (!order) {
      throw new AppError("Pedido nao encontrado.", 404);
    }

    await ensureProductOrderAccess(actor, order);

    if (actor.role === Role.CLIENT) {
      if (order.status === ProductOrderStatus.DELIVERED) {
        throw new AppError("Pedido entregue nao pode ser cancelado.");
      }

      if (order.paymentStatus === PaymentStatus.PAID) {
        throw new AppError("Pedido pago nao pode ser cancelado pelo cliente.");
      }
    }

    return this.update(actor, id, {
      paymentStatus:
        order.paymentStatus === PaymentStatus.PAID
          ? undefined
          : PaymentStatus.CANCELED,
      status: ProductOrderStatus.CANCELED,
    });
  },
};

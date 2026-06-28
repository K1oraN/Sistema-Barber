import { Role } from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import type {
  CreateProductData,
  UpdateProductData,
} from "../validations/productValidation.js";

type ListFilters = {
  active?: boolean;
};

type Actor = {
  id: string;
  role: Role;
};

function ensureReservedStockFits(stock: number, reservedStock?: number) {
  if (reservedStock !== undefined && reservedStock > stock) {
    throw new AppError("Estoque reservado nao pode ser maior que o estoque total.");
  }
}

export const productService = {
  async list(actor: Actor, filters: ListFilters) {
    return prisma.product.findMany({
      where:
        actor.role === Role.ADMIN
          ? filters.active === undefined
            ? undefined
            : { active: filters.active }
          : { active: true },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string, actor?: Actor) {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new AppError("Produto nao encontrado.", 404);
    }

    if (actor && actor.role !== Role.ADMIN && !product.active) {
      throw new AppError("Produto nao encontrado.", 404);
    }

    return product;
  },

  async create(data: CreateProductData) {
    const existingProduct = await prisma.product.findUnique({
      where: { name: data.name },
    });

    if (existingProduct) {
      throw new AppError("Ja existe um produto com este nome.", 409);
    }

    ensureReservedStockFits(data.stock, data.reservedStock);

    return prisma.product.create({
      data: {
        ...data,
        active: data.active ?? true,
        allowPreOrder: data.allowPreOrder ?? false,
        reservedStock: data.reservedStock ?? 0,
      },
    });
  },

  async update(id: string, data: UpdateProductData) {
    const currentProduct = await this.getById(id);

    if (data.name) {
      const existingProduct = await prisma.product.findUnique({
        where: { name: data.name },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new AppError("Ja existe um produto com este nome.", 409);
      }
    }

    const nextStock = data.stock ?? currentProduct.stock;
    const nextReservedStock = data.reservedStock ?? currentProduct.reservedStock;
    ensureReservedStockFits(nextStock, nextReservedStock);

    return prisma.product.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.getById(id);

    return prisma.product.update({
      where: { id },
      data: { active: false },
    });
  },
};

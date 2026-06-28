import { Role } from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import type {
  CreateServiceData,
  UpdateServiceData,
} from "../validations/serviceValidation.js";

type ListFilters = {
  active?: boolean;
};

type Actor = {
  id: string;
  role: Role;
};

export const serviceService = {
  async list(actor: Actor, filters: ListFilters) {
    return prisma.service.findMany({
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
    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      throw new AppError("Servico nao encontrado.", 404);
    }

    if (actor && actor.role !== Role.ADMIN && !service.active) {
      throw new AppError("Servico nao encontrado.", 404);
    }

    return service;
  },

  async create(data: CreateServiceData) {
    const existingService = await prisma.service.findUnique({
      where: { name: data.name },
    });

    if (existingService) {
      throw new AppError("Ja existe um servico com este nome.", 409);
    }

    return prisma.service.create({
      data: {
        ...data,
        active: data.active ?? true,
      },
    });
  },

  async update(id: string, data: UpdateServiceData) {
    await this.getById(id);

    if (data.name) {
      const existingService = await prisma.service.findUnique({
        where: { name: data.name },
      });

      if (existingService && existingService.id !== id) {
        throw new AppError("Ja existe um servico com este nome.", 409);
      }
    }

    return prisma.service.update({
      where: { id },
      data,
    });
  },

  async remove(id: string) {
    await this.getById(id);

    return prisma.service.update({
      where: { id },
      data: { active: false },
    });
  },
};

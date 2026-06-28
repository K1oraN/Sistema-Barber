import { RewardType, Role } from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import type {
  CreateRewardData,
  UpdateRewardData,
} from "../validations/rewardValidation.js";

type ListFilters = {
  active?: boolean;
};

type Actor = {
  id: string;
  role: Role;
};

export const rewardService = {
  async list(actor: Actor, filters: ListFilters) {
    return prisma.reward.findMany({
      where:
        actor.role === Role.ADMIN
          ? filters.active === undefined
            ? undefined
            : { active: filters.active }
          : { active: true },
      include: {
        product: true,
        service: true,
      },
      orderBy: { requiredPoints: "asc" },
    });
  },

  async getById(id: string, actor?: Actor) {
    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        product: true,
        service: true,
      },
    });

    if (!reward) {
      throw new AppError("Premio nao encontrado.", 404);
    }

    if (actor && actor.role !== Role.ADMIN && !reward.active) {
      throw new AppError("Premio nao encontrado.", 404);
    }

    return reward;
  },

  async create(data: CreateRewardData) {
    const existingReward = await prisma.reward.findUnique({
      where: { name: data.name },
    });

    if (existingReward) {
      throw new AppError("Ja existe um premio com este nome.", 409);
    }

    await validateRewardTarget(data);

    return prisma.reward.create({
      data: {
        ...data,
        active: data.active ?? true,
      },
    });
  },

  async update(id: string, data: UpdateRewardData) {
    await this.getById(id);

    if (data.name) {
      const existingReward = await prisma.reward.findUnique({
        where: { name: data.name },
      });

      if (existingReward && existingReward.id !== id) {
        throw new AppError("Ja existe um premio com este nome.", 409);
      }
    }

    await validateRewardTarget(data);

    return prisma.reward.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.getById(id);

    return prisma.reward.update({
      where: { id },
      data: { active: false },
    });
  },
};

async function validateRewardTarget(data: CreateRewardData | UpdateRewardData) {
  if (data.rewardType === RewardType.PRODUCT || data.rewardType === RewardType.GIFT) {
    if (!data.productId) {
      throw new AppError("Informe o produto vinculado ao premio.");
    }

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new AppError("Produto do premio nao encontrado.", 404);
    }
  }

  if (data.rewardType === RewardType.SERVICE && data.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      throw new AppError("Servico do premio nao encontrado.", 404);
    }
  }

  if (
    data.rewardType === RewardType.DISCOUNT &&
    (data.discountValue === undefined || data.discountValue === null)
  ) {
    throw new AppError("Informe o valor de desconto do premio.");
  }
}

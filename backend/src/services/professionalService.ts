import { AppointmentStatus, Role } from "../generated/prisma/client.js";
import type {
  Professional,
  ProfessionalTimeBlock,
} from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import { dateOnly, ensureFutureAppointment, timeOnly } from "../utils/date.js";
import { publicUser } from "../utils/publicUser.js";
import type {
  CreateProfessionalData,
  CreateProfessionalTimeBlockData,
  UpdateProfessionalData,
  UpdateProfessionalStatusData,
} from "../validations/professionalValidation.js";

type Actor = {
  id: string;
  role: Role;
};

type ProfessionalWithUser = Professional & {
  user?: Parameters<typeof publicUser>[0];
};

function safeProfessional(professional: ProfessionalWithUser) {
  if (!professional.user) {
    return professional;
  }

  const { user, ...professionalData } = professional;

  return {
    ...professionalData,
    user: publicUser(user),
  };
}

type ListFilters = {
  active?: boolean;
};

async function getExistingProfessional(id: string) {
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!professional) {
    throw new AppError("Profissional nao encontrado.", 404);
  }

  return professional;
}

async function getProfessionalForActor(actor: Actor) {
  if (actor.role !== Role.PROFESSIONAL) {
    throw new AppError("Apenas profissionais podem acessar este recurso.", 403);
  }

  const professional = await prisma.professional.findUnique({
    where: { userId: actor.id },
    include: { user: true },
  });

  if (!professional) {
    throw new AppError("Cadastro profissional nao encontrado.", 403);
  }

  return professional;
}

function serializeTimeBlock(block: ProfessionalTimeBlock) {
  return block;
}

async function ensureBlockSlotIsFree(input: {
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const [appointmentConflict, blockConflict] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        professionalId: input.professionalId,
        date: dateOnly(input.date),
        status: {
          not: AppointmentStatus.CANCELED,
        },
        startTime: {
          lt: timeOnly(input.endTime),
        },
        endTime: {
          gt: timeOnly(input.startTime),
        },
      },
    }),
    prisma.professionalTimeBlock.findFirst({
      where: {
        professionalId: input.professionalId,
        date: dateOnly(input.date),
        startTime: {
          lt: timeOnly(input.endTime),
        },
        endTime: {
          gt: timeOnly(input.startTime),
        },
      },
    }),
  ]);

  if (appointmentConflict) {
    throw new AppError("Ja existe agendamento nesse horario.");
  }

  if (blockConflict) {
    throw new AppError("Este horario ja esta bloqueado.");
  }
}

export const professionalService = {
  async list(actor: Actor, filters: ListFilters) {
    if (actor.role === Role.PROFESSIONAL) {
      const professional = await getProfessionalForActor(actor);
      return [safeProfessional(professional)];
    }

    const professionals = await prisma.professional.findMany({
      where:
        actor.role === Role.CLIENT
          ? { active: true }
          : filters.active === undefined
            ? undefined
            : { active: filters.active },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return professionals.map(safeProfessional);
  },

  async getById(actor: Actor, id: string) {
    const professional = await getExistingProfessional(id);

    if (actor.role === Role.PROFESSIONAL && professional.userId !== actor.id) {
      throw new AppError("Voce nao pode acessar dados de outro profissional.", 403);
    }

    if (actor.role === Role.CLIENT && !professional.active) {
      throw new AppError("Profissional nao encontrado.", 404);
    }

    return safeProfessional(professional);
  },

  async getMe(actor: Actor) {
    const professional = await getProfessionalForActor(actor);
    return safeProfessional(professional);
  },

  async getByUserId(userId: string) {
    const professional = await prisma.professional.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!professional) {
      throw new AppError("Profissional nao encontrado para este usuario.", 404);
    }

    return professional;
  },

  async create(data: CreateProfessionalData) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    if (user.role !== Role.PROFESSIONAL) {
      throw new AppError(
        "Somente usuarios do tipo PROFESSIONAL podem ter ficha profissional.",
      );
    }

    const existingProfessional = await prisma.professional.findUnique({
      where: { userId: data.userId },
    });

    if (existingProfessional) {
      throw new AppError("Este usuario ja possui cadastro profissional.", 409);
    }

    const professional = await prisma.professional.create({
      data: {
        userId: data.userId,
        specialty: data.specialty,
        commissionPercent: data.commissionPercent,
        online: data.online ?? false,
        active: data.active ?? true,
      },
      include: { user: true },
    });

    return safeProfessional(professional);
  },

  async update(id: string, data: UpdateProfessionalData) {
    await getExistingProfessional(id);

    const professional = await prisma.professional.update({
      where: { id },
      data,
      include: { user: true },
    });

    return safeProfessional(professional);
  },

  async updateOwnStatus(actor: Actor, data: UpdateProfessionalStatusData) {
    const professional = await getProfessionalForActor(actor);

    const updatedProfessional = await prisma.professional.update({
      where: { id: professional.id },
      data: { online: data.online },
      include: { user: true },
    });

    return safeProfessional(updatedProfessional);
  },

  async listOwnTimeBlocks(actor: Actor) {
    const professional = await getProfessionalForActor(actor);
    const today = new Date().toISOString().slice(0, 10);

    const blocks = await prisma.professionalTimeBlock.findMany({
      where: {
        professionalId: professional.id,
        date: {
          gte: dateOnly(today),
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return blocks.map(serializeTimeBlock);
  },

  async createOwnTimeBlock(actor: Actor, data: CreateProfessionalTimeBlockData) {
    const professional = await getProfessionalForActor(actor);

    ensureFutureAppointment(data.date, data.startTime);

    await ensureBlockSlotIsFree({
      professionalId: professional.id,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const block = await prisma.professionalTimeBlock.create({
      data: {
        professionalId: professional.id,
        date: dateOnly(data.date),
        startTime: timeOnly(data.startTime),
        endTime: timeOnly(data.endTime),
        reason: data.reason,
      },
    });

    return serializeTimeBlock(block);
  },

  async remove(id: string) {
    await getExistingProfessional(id);

    const professional = await prisma.professional.update({
      where: { id },
      data: { active: false },
      include: { user: true },
    });

    return safeProfessional(professional);
  },
};

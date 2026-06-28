import {
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
  type Appointment,
} from "../generated/prisma/client.js";
import {
  ensureEndTimeMatchesServiceDuration,
  ensureStartTimeMatchesScheduleStep,
  ensureWithinWorkingHours,
  APPOINTMENT_STEP_MINUTES,
  getServiceDurationMinutes,
  getWorkingPeriodsForDate,
  minutesToTime,
  timeToMinutes,
} from "../config/openingHours.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import {
  dateTimeFromParts,
  dateOnly,
  ensureFutureAppointment,
  timeOnly,
} from "../utils/date.js";
import { publicUser } from "../utils/publicUser.js";
import type {
  CreateAppointmentData,
  AvailabilityQueryData,
  UpdateAppointmentData,
} from "../validations/appointmentValidation.js";

type Actor = {
  id: string;
  role: Role;
};

type AppointmentWithRelations = Appointment & {
  client?: Parameters<typeof publicUser>[0];
  professional?: {
    id: string;
    userId: string;
    specialty: string;
    commissionPercent: unknown;
    online: boolean;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: Parameters<typeof publicUser>[0];
  };
  service?: unknown;
  payment?: unknown;
};

const appointmentInclude = {
  client: true,
  professional: {
    include: {
      user: true,
    },
  },
  service: true,
  payment: true,
};

function safeAppointment(appointment: AppointmentWithRelations) {
  const { client, professional, ...appointmentData } = appointment;

  return {
    ...appointmentData,
    client: client ? publicUser(client) : undefined,
    professional: professional
      ? {
          ...professional,
          user: professional.user ? publicUser(professional.user) : undefined,
        }
      : undefined,
  };
}

async function getProfessionalForActor(actor: Actor) {
  const professional = await prisma.professional.findUnique({
    where: { userId: actor.id },
  });

  if (!professional) {
    throw new AppError("Cadastro profissional nao encontrado.", 403);
  }

  return professional;
}

function canAccessAppointment(actor: Actor, appointment: Appointment) {
  if (actor.role === Role.ADMIN) {
    return true;
  }

  if (actor.role === Role.CLIENT) {
    return appointment.clientId === actor.id;
  }

  return false;
}

async function ensureAppointmentAccess(actor: Actor, appointment: Appointment) {
  if (canAccessAppointment(actor, appointment)) {
    return;
  }

  if (actor.role === Role.PROFESSIONAL) {
    const professional = await getProfessionalForActor(actor);

    if (appointment.professionalId === professional.id) {
      return;
    }
  }

  throw new AppError("Voce nao pode acessar este agendamento.", 403);
}

async function ensureNoScheduleConflict(input: {
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  ignoreAppointmentId?: string;
}) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      id: input.ignoreAppointmentId
        ? {
            not: input.ignoreAppointmentId,
          }
        : undefined,
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
  });

  if (conflict) {
    throw new AppError("Este profissional ja possui agendamento nesse horario.");
  }

  const blockConflict = await prisma.professionalTimeBlock.findFirst({
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
  });

  if (blockConflict) {
    throw new AppError("Este horario esta bloqueado pelo profissional.");
  }
}

function canceledPaymentStatus(status: PaymentStatus) {
  return (
    status === PaymentStatus.PENDING ||
    status === PaymentStatus.AWAITING_CONFIRMATION
  );
}

async function ensureAppointmentEntities(input: {
  clientId: string;
  professionalId: string;
  serviceId: string;
}) {
  const [client, professional, service] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.clientId } }),
    prisma.professional.findUnique({ where: { id: input.professionalId } }),
    prisma.service.findUnique({ where: { id: input.serviceId } }),
  ]);

  if (!client || client.role !== Role.CLIENT || !client.active) {
    throw new AppError("Cliente invalido ou inativo.");
  }

  if (!professional || !professional.active) {
    throw new AppError("Profissional invalido ou inativo.");
  }

  if (!service || !service.active) {
    throw new AppError("Servico invalido ou inativo.");
  }

  return { client, professional, service };
}

export const appointmentService = {
  async getAvailability(data: AvailabilityQueryData) {
    const [professional, service] = await Promise.all([
      prisma.professional.findUnique({ where: { id: data.professionalId } }),
      prisma.service.findUnique({ where: { id: data.serviceId } }),
    ]);

    if (!professional || !professional.active) {
      throw new AppError("Profissional invalido ou inativo.");
    }

    if (!service || !service.active) {
      throw new AppError("Servico invalido ou inativo.");
    }

    const today = new Date();
    const selectedDate = dateOnly(data.date);
    const todayOnly = dateOnly(today.toISOString().slice(0, 10));

    if (selectedDate < todayOnly) {
      throw new AppError("Nao e permitido buscar horarios em data passada.");
    }

    const [appointments, timeBlocks] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          professionalId: data.professionalId,
          date: selectedDate,
          status: {
            not: AppointmentStatus.CANCELED,
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      }),
      prisma.professionalTimeBlock.findMany({
        where: {
          professionalId: data.professionalId,
          date: selectedDate,
        },
        select: {
          startTime: true,
          endTime: true,
        },
      }),
    ]);

    const periods = getWorkingPeriodsForDate(data.date);
    const stepMinutes = APPOINTMENT_STEP_MINUTES;
    const durationMinutes = getServiceDurationMinutes(service.durationMinutes);

    const slots = [];

    for (const period of periods) {
      for (
        let startMinutes = period.startMinutes;
        startMinutes + durationMinutes <= period.endMinutes;
        startMinutes += stepMinutes
      ) {
        const endMinutes = startMinutes + durationMinutes;
        const startTime = minutesToTime(startMinutes);
        const endTime = minutesToTime(endMinutes);
        const startsAt = dateTimeFromParts(data.date, startTime);

        if (startsAt < today) {
          continue;
        }

        const appointmentOccupied = appointments.some((appointment) => {
          const occupiedStart = timeToMinutes(appointment.startTime);
          const occupiedEnd = timeToMinutes(appointment.endTime);

          return startMinutes < occupiedEnd && endMinutes > occupiedStart;
        });

        const blocked = timeBlocks.some((block) => {
          const blockedStart = timeToMinutes(block.startTime);
          const blockedEnd = timeToMinutes(block.endTime);

          return startMinutes < blockedEnd && endMinutes > blockedStart;
        });

        slots.push({
          startTime,
          endTime,
          available: !appointmentOccupied && !blocked,
        });
      }
    }

    return {
      date: data.date,
      professionalId: data.professionalId,
      serviceId: data.serviceId,
      durationMinutes,
      slots,
    };
  },

  async list(actor: Actor) {
    if (actor.role === Role.ADMIN) {
      const appointments = await prisma.appointment.findMany({
        include: appointmentInclude,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      });

      return appointments.map(safeAppointment);
    }

    if (actor.role === Role.CLIENT) {
      const appointments = await prisma.appointment.findMany({
        where: { clientId: actor.id },
        include: appointmentInclude,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      });

      return appointments.map(safeAppointment);
    }

    const professional = await getProfessionalForActor(actor);

    const appointments = await prisma.appointment.findMany({
      where: { professionalId: professional.id },
      include: appointmentInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return appointments.map(safeAppointment);
  },

  async getById(actor: Actor, id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });

    if (!appointment) {
      throw new AppError("Agendamento nao encontrado.", 404);
    }

    await ensureAppointmentAccess(actor, appointment);

    return safeAppointment(appointment);
  },

  async create(actor: Actor, data: CreateAppointmentData) {
    const clientId = actor.role === Role.CLIENT ? actor.id : data.clientId;

    if (!clientId) {
      throw new AppError("Informe o cliente do agendamento.");
    }

    let professionalId = data.professionalId;

    if (actor.role === Role.PROFESSIONAL) {
      const professional = await getProfessionalForActor(actor);

      if (professional.id !== data.professionalId) {
        throw new AppError("Voce so pode criar agendamentos na sua agenda.", 403);
      }

      professionalId = professional.id;
    }

    ensureFutureAppointment(data.date, data.startTime);

    const { service } = await ensureAppointmentEntities({
      clientId,
      professionalId,
      serviceId: data.serviceId,
    });
    const durationMinutes = getServiceDurationMinutes(service.durationMinutes);

    ensureStartTimeMatchesScheduleStep(data.startTime);
    ensureEndTimeMatchesServiceDuration({
      durationMinutes,
      endTime: data.endTime,
      startTime: data.startTime,
    });
    ensureWithinWorkingHours({
      date: data.date,
      endTime: data.endTime,
      startTime: data.startTime,
    });

    if (!data.isExtraSlot) {
      await ensureNoScheduleConflict({
        professionalId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      });
    }

    const totalValue = data.totalValue ?? service.price.toString();
    const paymentMethod =
      (data.paymentMethod as PaymentMethod | null | undefined) ?? PaymentMethod.PIX;
    const status =
      actor.role === Role.CLIENT
        ? AppointmentStatus.SCHEDULED
        : data.status ?? AppointmentStatus.SCHEDULED;

    const appointment = await prisma.$transaction(async (tx) => {
      const createdAppointment = await tx.appointment.create({
        data: {
          clientId,
          professionalId,
          serviceId: data.serviceId,
          date: dateOnly(data.date),
          startTime: timeOnly(data.startTime),
          endTime: timeOnly(data.endTime),
          status,
          isExtraSlot: data.isExtraSlot ?? false,
          notes: data.notes,
          totalValue,
          paymentMethod,
        },
      });

      await tx.payment.create({
        data: {
          appointmentId: createdAppointment.id,
          clientId,
          amount: totalValue,
          method: paymentMethod,
          status: PaymentStatus.PENDING,
        },
      });

      return tx.appointment.findUniqueOrThrow({
        where: { id: createdAppointment.id },
        include: appointmentInclude,
      });
    });

    return safeAppointment(appointment);
  },

  async update(actor: Actor, id: string, data: UpdateAppointmentData) {
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!currentAppointment) {
      throw new AppError("Agendamento nao encontrado.", 404);
    }

    await ensureAppointmentAccess(actor, currentAppointment);

    if (
      actor.role === Role.CLIENT &&
      currentAppointment.status === AppointmentStatus.FINISHED &&
      data.status === AppointmentStatus.CANCELED
    ) {
      throw new AppError("Nao e permitido cancelar agendamento ja finalizado.");
    }

    if (actor.role === Role.CLIENT && data.status && data.status !== AppointmentStatus.CANCELED) {
      throw new AppError("Cliente so pode cancelar o proprio agendamento.", 403);
    }

    let professionalId = data.professionalId ?? currentAppointment.professionalId;

    if (actor.role === Role.PROFESSIONAL) {
      const professional = await getProfessionalForActor(actor);

      if (professional.id !== currentAppointment.professionalId) {
        throw new AppError("Voce so pode alterar seus proprios agendamentos.", 403);
      }

      if (data.professionalId && data.professionalId !== professional.id) {
        throw new AppError("Voce nao pode mover agendamentos para outro profissional.", 403);
      }

      professionalId = professional.id;
    }

    const serviceId = data.serviceId ?? currentAppointment.serviceId;
    const clientId = data.clientId ?? currentAppointment.clientId;
    const date = data.date ?? currentAppointment.date.toISOString().slice(0, 10);
    const startTime =
      data.startTime ?? currentAppointment.startTime.toISOString().slice(11, 16);
    const endTime =
      data.endTime ?? currentAppointment.endTime.toISOString().slice(11, 16);
    const nextStatus = data.status ?? currentAppointment.status;
    const nextIsExtraSlot = data.isExtraSlot ?? currentAppointment.isExtraSlot;
    const scheduleChanged = Boolean(
      data.clientId ||
        data.date ||
        data.endTime ||
        data.professionalId ||
        data.serviceId ||
        data.startTime,
    );
    const scheduleReactivated =
      Boolean(data.status) &&
      (currentAppointment.status === AppointmentStatus.CANCELED ||
        currentAppointment.status === AppointmentStatus.FINISHED) &&
      nextStatus !== AppointmentStatus.CANCELED &&
      nextStatus !== AppointmentStatus.FINISHED;

    const { service } = await ensureAppointmentEntities({
      clientId,
      professionalId,
      serviceId,
    });

    if (
      (scheduleChanged || scheduleReactivated) &&
      nextStatus !== AppointmentStatus.CANCELED &&
      nextStatus !== AppointmentStatus.FINISHED
    ) {
      ensureFutureAppointment(date, startTime);
    }

    if (
      (scheduleChanged || scheduleReactivated) &&
      !nextIsExtraSlot &&
      nextStatus !== AppointmentStatus.CANCELED &&
      nextStatus !== AppointmentStatus.FINISHED
    ) {
      const durationMinutes = getServiceDurationMinutes(service.durationMinutes);

      ensureStartTimeMatchesScheduleStep(startTime);
      ensureEndTimeMatchesServiceDuration({
        durationMinutes,
        endTime,
        startTime,
      });
      ensureWithinWorkingHours({
        date,
        endTime,
        startTime,
      });

      await ensureNoScheduleConflict({
        professionalId,
        date,
        startTime,
        endTime,
        ignoreAppointmentId: id,
      });
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: {
          cancelReason:
            nextStatus === AppointmentStatus.CANCELED
              ? data.cancelReason ?? currentAppointment.cancelReason
              : data.cancelReason,
          canceledAt:
            nextStatus === AppointmentStatus.CANCELED &&
            currentAppointment.status !== AppointmentStatus.CANCELED
              ? now
              : undefined,
          canceledById:
            nextStatus === AppointmentStatus.CANCELED &&
            currentAppointment.status !== AppointmentStatus.CANCELED
              ? actor.id
              : undefined,
          clientId,
          confirmedAt:
            nextStatus === AppointmentStatus.CONFIRMED &&
            currentAppointment.status !== AppointmentStatus.CONFIRMED
              ? now
              : undefined,
          confirmedById:
            nextStatus === AppointmentStatus.CONFIRMED &&
            currentAppointment.status !== AppointmentStatus.CONFIRMED
              ? actor.id
              : undefined,
          date: dateOnly(date),
          endTime: timeOnly(endTime),
          isExtraSlot: data.isExtraSlot,
          notes: data.notes,
          paymentMethod: data.paymentMethod as PaymentMethod | null | undefined,
          professionalId,
          serviceId,
          startTime: timeOnly(startTime),
          status: nextStatus,
          totalValue: data.totalValue,
        },
      });

      if (nextStatus === AppointmentStatus.CANCELED) {
        await tx.payment.updateMany({
          where: {
            appointmentId: id,
            status: {
              in: [PaymentStatus.PENDING, PaymentStatus.AWAITING_CONFIRMATION],
            },
          },
          data: { status: PaymentStatus.CANCELED },
        });
      }

      return tx.appointment.findUniqueOrThrow({
        where: { id: updatedAppointment.id },
        include: appointmentInclude,
      });
    });

    return safeAppointment(appointment);
  },

  async finish(actor: Actor, id: string) {
    if (actor.role === Role.CLIENT) {
      throw new AppError("Cliente nao pode finalizar atendimento.", 403);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        payment: true,
        professional: true,
      },
    });

    if (!appointment) {
      throw new AppError("Agendamento nao encontrado.", 404);
    }

    await ensureAppointmentAccess(actor, appointment);

    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new AppError("Nao e permitido finalizar agendamento cancelado.");
    }

    const shouldAwardPoints = appointment.status !== AppointmentStatus.FINISHED;
    const paymentMethod =
      appointment.payment?.method ?? appointment.paymentMethod ?? PaymentMethod.CASH;
    const pointsToAdd = shouldAwardPoints
      ? Math.max(Math.floor(Number(appointment.totalValue)), 1)
      : 0;

    const finishedAppointment = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: {
          finishedAt: new Date(),
          finishedById: actor.id,
          paymentMethod,
          status: AppointmentStatus.FINISHED,
        },
      });

      await tx.payment.upsert({
        where: { appointmentId: id },
        update: {
          amount: appointment.totalValue,
          confirmedAt:
            appointment.payment?.status === PaymentStatus.PAID
              ? appointment.payment.confirmedAt ?? new Date()
              : new Date(),
          confirmedById:
            appointment.payment?.status === PaymentStatus.PAID
              ? appointment.payment.confirmedById ?? actor.id
              : actor.id,
          method: paymentMethod,
          status: PaymentStatus.PAID,
        },
        create: {
          appointmentId: id,
          clientId: appointment.clientId,
          amount: appointment.totalValue,
          method: paymentMethod,
          confirmedAt: new Date(),
          confirmedById: actor.id,
          status: PaymentStatus.PAID,
        },
      });

      if (pointsToAdd > 0) {
        const client = await tx.user.findUnique({
          where: { id: appointment.clientId },
          select: { points: true },
        });

        if (client) {
          const nextPoints = client.points + pointsToAdd;
          const nextLevel = Math.max(1, Math.floor(nextPoints / 100) + 1);

          await tx.user.update({
            where: { id: appointment.clientId },
            data: {
              level: nextLevel,
              points: nextPoints,
            },
          });
        }
      }

      return tx.appointment.findUniqueOrThrow({
        where: { id },
        include: appointmentInclude,
      });
    });

    return safeAppointment(finishedAppointment);
  },

  async remove(actor: Actor, id: string) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new AppError("Agendamento nao encontrado.", 404);
    }

    await ensureAppointmentAccess(actor, appointment);

    if (actor.role === Role.ADMIN) {
      await prisma.appointment.delete({ where: { id } });
      return { message: "Agendamento removido com sucesso." };
    }

    if (appointment.status === AppointmentStatus.FINISHED) {
      throw new AppError("Nao e permitido cancelar agendamento ja finalizado.");
    }

    const canceledAppointment = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: {
          canceledAt: new Date(),
          canceledById: actor.id,
          status: AppointmentStatus.CANCELED,
        },
      });

      const payment = await tx.payment.findUnique({
        where: { appointmentId: id },
      });

      if (payment && canceledPaymentStatus(payment.status)) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.CANCELED },
        });
      }

      return tx.appointment.findUniqueOrThrow({
        where: { id },
        include: appointmentInclude,
      });
    });

    return safeAppointment(canceledAppointment);
  },
};

import { z } from "zod";
import {
  atLeastOneField,
  dateString,
  nonEmptyString,
  nonNegativeMoney,
  timeString,
} from "./commonValidation.js";

const appointmentTimeRange = {
  date: dateString,
  startTime: timeString,
  endTime: timeString,
};

function hasValidTimeRange(data: { startTime?: string; endTime?: string }) {
  if (!data.startTime || !data.endTime) {
    return true;
  }

  return data.endTime > data.startTime;
}

export const createAppointmentSchema = z
  .object({
    clientId: z.string().uuid("Cliente invalido.").optional(),
    professionalId: z.string().uuid("Profissional invalido."),
    serviceId: z.string().uuid("Servico invalido."),
    ...appointmentTimeRange,
    status: z
      .enum(["SCHEDULED", "CONFIRMED", "CANCELED", "FINISHED"])
      .optional(),
    notes: nonEmptyString("Observacao nao pode ficar vazia.").optional().nullable(),
    totalValue: nonNegativeMoney.optional(),
    paymentMethod: z.enum(["PIX", "CARD", "CASH"]).optional().nullable(),
    isExtraSlot: z.boolean().optional(),
    cancelReason: nonEmptyString("Informe o motivo.").optional().nullable(),
  })
  .refine(hasValidTimeRange, {
    message: "O horario final deve ser maior que o horario inicial.",
    path: ["endTime"],
  });

export const updateAppointmentSchema = z
  .object({
    clientId: z.string().uuid("Cliente invalido.").optional(),
    professionalId: z.string().uuid("Profissional invalido.").optional(),
    serviceId: z.string().uuid("Servico invalido.").optional(),
    date: dateString.optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
    status: z
      .enum(["SCHEDULED", "CONFIRMED", "CANCELED", "FINISHED"])
      .optional(),
    notes: nonEmptyString("Observacao nao pode ficar vazia.").optional().nullable(),
    totalValue: nonNegativeMoney.optional(),
    paymentMethod: z.enum(["PIX", "CARD", "CASH"]).optional().nullable(),
    isExtraSlot: z.boolean().optional(),
    cancelReason: nonEmptyString("Informe o motivo.").optional().nullable(),
  })
  .refine(atLeastOneField(), {
    message: "Informe ao menos um campo para atualizar.",
  })
  .refine(hasValidTimeRange, {
    message: "O horario final deve ser maior que o horario inicial.",
    path: ["endTime"],
  });

export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;

export const availabilityQuerySchema = z.object({
  professionalId: z.string().uuid("Profissional invalido."),
  serviceId: z.string().uuid("Servico invalido."),
  date: dateString,
});

export type AvailabilityQueryData = z.infer<typeof availabilityQuerySchema>;

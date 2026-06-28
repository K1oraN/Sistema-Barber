import { z } from "zod";
import {
  atLeastOneField,
  dateString,
  nonEmptyString,
  nonNegativeMoney,
  timeString,
} from "./commonValidation.js";

function hasValidTimeRange(data: { startTime?: string; endTime?: string }) {
  if (!data.startTime || !data.endTime) {
    return true;
  }

  return data.endTime > data.startTime;
}

export const createProfessionalSchema = z.object({
  userId: z.string().uuid("Usuario invalido."),
  specialty: nonEmptyString("Informe a especialidade."),
  commissionPercent: nonNegativeMoney,
  online: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const updateProfessionalSchema = z
  .object({
    specialty: nonEmptyString("Informe a especialidade.").optional(),
    commissionPercent: nonNegativeMoney.optional(),
    online: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .refine(atLeastOneField(), {
    message: "Informe ao menos um campo para atualizar.",
  });

export const updateProfessionalStatusSchema = z.object({
  online: z.boolean(),
});

export const createProfessionalTimeBlockSchema = z
  .object({
    date: dateString,
    startTime: timeString,
    endTime: timeString,
    reason: nonEmptyString("Informe o motivo do bloqueio.").optional().nullable(),
  })
  .refine(hasValidTimeRange, {
    message: "O horario final deve ser maior que o horario inicial.",
    path: ["endTime"],
  });

export type CreateProfessionalData = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalData = z.infer<typeof updateProfessionalSchema>;
export type UpdateProfessionalStatusData = z.infer<
  typeof updateProfessionalStatusSchema
>;
export type CreateProfessionalTimeBlockData = z.infer<
  typeof createProfessionalTimeBlockSchema
>;

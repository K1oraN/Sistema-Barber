import { z } from "zod";
import {
  atLeastOneField,
  nonEmptyString,
  nonNegativeMoney,
  optionalString,
  optionalUrl,
  positiveMinutes,
} from "./commonValidation.js";

export const createServiceSchema = z.object({
  name: nonEmptyString("Informe o nome do servico."),
  description: optionalString("Informe a descricao do servico."),
  price: nonNegativeMoney,
  durationLabel: optionalString("Informe o rotulo da duracao."),
  durationMinutes: positiveMinutes,
  imageUrl: optionalUrl,
  active: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial().refine(atLeastOneField(), {
  message: "Informe ao menos um campo para atualizar.",
});

export type CreateServiceData = z.infer<typeof createServiceSchema>;
export type UpdateServiceData = z.infer<typeof updateServiceSchema>;

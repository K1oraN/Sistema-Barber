import { z } from "zod";
import {
  atLeastOneField,
  nonEmptyString,
  nonNegativeMoney,
  optionalString,
  optionalUrl,
} from "./commonValidation.js";

export const createPlanSchema = z.object({
  name: nonEmptyString("Informe o nome do plano."),
  description: optionalString("Informe a descricao do plano."),
  price: nonNegativeMoney,
  benefits: z
    .array(nonEmptyString("Beneficio nao pode ficar vazio."))
    .min(1, "Informe ao menos um beneficio."),
  active: z.boolean().optional(),
  highlighted: z.boolean().optional(),
});

export const updatePlanSchema = createPlanSchema.partial().refine(atLeastOneField(), {
  message: "Informe ao menos um campo para atualizar.",
});

export const subscribePlanSchema = z.object({
  paymentStatus: z
    .enum(["PENDING", "AWAITING_CONFIRMATION"])
    .optional(),
});

export const planPaymentLinkSchema = z.object({
  infinityPayUrl: optionalUrl,
});

export type CreatePlanData = z.infer<typeof createPlanSchema>;
export type UpdatePlanData = z.infer<typeof updatePlanSchema>;
export type SubscribePlanData = z.infer<typeof subscribePlanSchema>;
export type PlanPaymentLinkData = z.infer<typeof planPaymentLinkSchema>;

import { z } from "zod";
import {
  atLeastOneField,
  nonEmptyString,
  nonNegativeInteger,
  nonNegativeMoney,
  optionalString,
  optionalUrl,
} from "./commonValidation.js";

export const createRewardSchema = z.object({
  name: nonEmptyString("Informe o nome do premio."),
  description: optionalString("Informe a descricao do premio."),
  requiredPoints: nonNegativeInteger,
  rewardType: z.enum(["SERVICE", "PRODUCT", "DISCOUNT", "GIFT"]).default("SERVICE"),
  serviceId: z.string().uuid("Servico invalido.").optional().nullable(),
  productId: z.string().uuid("Produto invalido.").optional().nullable(),
  discountValue: nonNegativeMoney.optional().nullable(),
  imageUrl: optionalUrl,
  active: z.boolean().optional(),
});

export const updateRewardSchema = createRewardSchema.partial().refine(atLeastOneField(), {
  message: "Informe ao menos um campo para atualizar.",
});

export type CreateRewardData = z.infer<typeof createRewardSchema>;
export type UpdateRewardData = z.infer<typeof updateRewardSchema>;

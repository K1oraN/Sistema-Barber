import { z } from "zod";
import { atLeastOneField } from "./commonValidation.js";

export const createRewardRedemptionSchema = z.object({
  clientId: z.string().uuid("Cliente invalido.").optional(),
  rewardId: z.string().uuid("Premio invalido."),
});

export const updateRewardRedemptionSchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "CANCELED"]).optional(),
  })
  .refine(atLeastOneField(), {
    message: "Informe ao menos um campo para atualizar.",
  });

export type CreateRewardRedemptionData = z.infer<
  typeof createRewardRedemptionSchema
>;
export type UpdateRewardRedemptionData = z.infer<
  typeof updateRewardRedemptionSchema
>;


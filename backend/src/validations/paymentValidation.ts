import { z } from "zod";
import {
  atLeastOneField,
  nonNegativeMoney,
  optionalUrl,
} from "./commonValidation.js";

export const createPaymentSchema = z.object({
  appointmentId: z.string().uuid("Agendamento invalido."),
  clientId: z.string().uuid("Cliente invalido.").optional(),
  amount: nonNegativeMoney,
  method: z.enum(["PIX", "CARD", "CASH"]),
  status: z.enum(["PENDING", "AWAITING_CONFIRMATION", "PAID", "CANCELED"]).optional(),
  infinityPayUrl: optionalUrl,
  receiptUrl: z.string().trim().max(7_000_000, "Comprovante muito grande.").optional(),
  receiptFileName: z.string().trim().max(255, "Nome do arquivo muito longo.").optional(),
  confirmationNote: z.string().trim().max(500, "Observacao muito longa.").optional().nullable(),
});

export const updatePaymentSchema = z
  .object({
    amount: nonNegativeMoney.optional(),
    method: z.enum(["PIX", "CARD", "CASH"]).optional(),
    status: z.enum(["PENDING", "AWAITING_CONFIRMATION", "PAID", "CANCELED"]).optional(),
    infinityPayUrl: optionalUrl,
    receiptUrl: z.string().trim().max(7_000_000, "Comprovante muito grande.").optional(),
    receiptFileName: z.string().trim().max(255, "Nome do arquivo muito longo.").optional(),
    confirmationNote: z.string().trim().max(500, "Observacao muito longa.").optional().nullable(),
  })
  .refine(atLeastOneField(), {
    message: "Informe ao menos um campo para atualizar.",
  });

export const paymentLinkSchema = z.object({
  infinityPayUrl: optionalUrl,
});

export type CreatePaymentData = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentData = z.infer<typeof updatePaymentSchema>;
export type PaymentLinkData = z.infer<typeof paymentLinkSchema>;

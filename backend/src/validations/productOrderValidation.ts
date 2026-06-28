import { z } from "zod";
import {
  atLeastOneField,
  optionalString,
  optionalUrl,
  positiveInteger,
} from "./commonValidation.js";

const productOrderStatusSchema = z.enum([
  "RESERVED",
  "PRE_ORDER_REQUESTED",
  "UNDER_REVIEW",
  "ORDERED",
  "AVAILABLE_FOR_PICKUP",
  "DELIVERED",
  "CANCELED",
]);

export const createProductOrderSchema = z.object({
  productId: z.string().uuid("Produto invalido."),
  quantity: positiveInteger,
  notes: optionalString("Informe uma observacao valida."),
});

export const updateProductOrderSchema = z
  .object({
    status: productOrderStatusSchema.optional(),
    paymentStatus: z
      .enum(["PENDING", "AWAITING_CONFIRMATION", "PAID", "CANCELED"])
      .optional(),
    paymentMethod: z.enum(["PIX", "CARD", "CASH"]).optional().nullable(),
    infinityPayUrl: optionalUrl,
    notes: optionalString("Informe uma observacao valida."),
    receiptUrl: z.string().trim().max(7_000_000, "Comprovante muito grande.").optional(),
    receiptFileName: z.string().trim().max(255, "Nome do arquivo muito longo.").optional(),
  })
  .refine(atLeastOneField(), {
    message: "Informe ao menos um campo para atualizar.",
  });

export const productOrderQuerySchema = z.object({
  client: z.string().trim().optional(),
  date: z.string().trim().optional(),
  orderType: z.enum(["RESERVATION", "PRE_ORDER"]).optional(),
  product: z.string().trim().optional(),
  status: productOrderStatusSchema.optional(),
});

export const productOrderPaymentLinkSchema = z.object({
  infinityPayUrl: optionalUrl,
});

export type CreateProductOrderData = z.infer<typeof createProductOrderSchema>;
export type UpdateProductOrderData = z.infer<typeof updateProductOrderSchema>;
export type ProductOrderQueryData = z.infer<typeof productOrderQuerySchema>;
export type ProductOrderPaymentLinkData = z.infer<typeof productOrderPaymentLinkSchema>;

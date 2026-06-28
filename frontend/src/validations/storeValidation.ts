import { z } from "zod";

export const productOrderFormSchema = z.object({
  notes: z.string().trim().optional(),
  quantity: z.coerce
    .number({ error: "Informe a quantidade." })
    .int("Informe um numero inteiro.")
    .positive("A quantidade deve ser maior que zero."),
});

export type ProductOrderFormData = z.infer<typeof productOrderFormSchema>;

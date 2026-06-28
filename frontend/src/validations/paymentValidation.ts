import { z } from "zod";

export const cardPaymentSchema = z.object({
  cvv: z.string().trim().min(3, "Informe o CVV.").max(4, "CVV invalido."),
  holder: z.string().trim().min(2, "Informe o nome impresso."),
  number: z.string().trim().min(13, "Informe o numero do cartao."),
  validThru: z.string().trim().min(5, "Informe a validade."),
});

export const paymentFormSchema = z
  .object({
    cvv: z.string().trim().optional(),
    holder: z.string().trim().optional(),
    method: z.enum(["PIX", "CARD", "CASH"]),
    number: z.string().trim().optional(),
    validThru: z.string().trim().optional(),
  })
  .superRefine((data, context) => {
    if (data.method !== "CARD") {
      return;
    }

    const result = cardPaymentSchema.safeParse(data);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        context.addIssue({
          code: "custom",
          message: issue.message,
          path: issue.path,
        });
      });
    }
  });

export type CardPaymentFormData = z.infer<typeof cardPaymentSchema>;
export type PaymentFormData = z.infer<typeof paymentFormSchema>;

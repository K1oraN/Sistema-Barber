import { z } from "zod";

const requiredText = (message: string) => z.string().trim().min(1, message);
const optionalText = z.string().trim().optional();
const optionalUrl = z
  .string()
  .trim()
  .url("Informe uma URL valida.")
  .or(z.literal(""))
  .optional();
const nonNegativeMoney = z.coerce
  .number({ error: "Informe um valor valido." })
  .nonnegative("O preco nao pode ser negativo.")
  .transform((value) => value.toFixed(2));
const nonNegativeInteger = z.coerce
  .number({ error: "Informe um numero valido." })
  .int("Informe um numero inteiro.")
  .nonnegative("A quantidade nao pode ser negativa.")
  .transform((value) => String(value));

export const serviceAdminSchema = z.object({
  active: z.boolean(),
  description: optionalText,
  durationLabel: optionalText,
  durationMinutes: z.coerce
    .number({ error: "Informe a duracao." })
    .int("Informe uma duracao inteira.")
    .positive("A duracao deve ser maior que zero."),
  imageUrl: optionalUrl,
  name: requiredText("Informe o nome."),
  price: nonNegativeMoney,
});

export const productAdminSchema = z.object({
  active: z.boolean(),
  allowPreOrder: z.boolean(),
  category: requiredText("Informe a categoria."),
  costPrice: nonNegativeMoney,
  description: optionalText,
  imageUrl: optionalUrl,
  name: requiredText("Informe o nome."),
  price: nonNegativeMoney,
  stock: nonNegativeInteger,
});

export const planAdminSchema = z.object({
  active: z.boolean(),
  benefits: requiredText("Informe ao menos um beneficio."),
  description: optionalText,
  highlighted: z.boolean(),
  name: requiredText("Informe o nome."),
  price: nonNegativeMoney,
});

export const rewardAdminSchema = z
  .object({
    active: z.boolean(),
    discountValue: z.string().trim().optional(),
    description: optionalText,
    imageUrl: optionalUrl,
    name: requiredText("Informe o nome."),
    productId: z.string().trim().optional(),
    requiredPoints: nonNegativeInteger,
    rewardType: z.enum(["SERVICE", "PRODUCT", "DISCOUNT", "GIFT"]),
    serviceId: z.string().trim().optional(),
  })
  .superRefine((data, context) => {
    if ((data.rewardType === "PRODUCT" || data.rewardType === "GIFT") && !data.productId) {
      context.addIssue({
        code: "custom",
        message: "Informe o produto do premio.",
        path: ["productId"],
      });
    }

    if (data.rewardType === "DISCOUNT") {
      const discountValue = Number(data.discountValue);

      if (!data.discountValue || Number.isNaN(discountValue) || discountValue < 0) {
        context.addIssue({
          code: "custom",
          message: "Informe um desconto valido.",
          path: ["discountValue"],
        });
      }
    }
  });

export const teamAdminSchema = z.object({
  active: z.boolean(),
  birthDate: z.string().optional(),
  commissionPercent: nonNegativeMoney,
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail valido."),
  name: requiredText("Informe o nome."),
  online: z.boolean(),
  password: z.string().optional(),
  phone: z.string().trim().min(14, "Informe um telefone valido."),
  specialty: requiredText("Informe a especialidade."),
});

export const createTeamAdminSchema = teamAdminSchema.extend({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const editTeamAdminSchema = teamAdminSchema.superRefine((data, context) => {
  if (data.password && data.password.length < 6) {
    context.addIssue({
      code: "custom",
      message: "A senha deve ter pelo menos 6 caracteres.",
      path: ["password"],
    });
  }
});

export type ServiceAdminFormData = z.infer<typeof serviceAdminSchema>;
export type ProductAdminFormData = z.infer<typeof productAdminSchema>;
export type PlanAdminFormData = z.infer<typeof planAdminSchema>;
export type RewardAdminFormData = z.infer<typeof rewardAdminSchema>;
export type TeamAdminFormData = z.infer<typeof teamAdminSchema>;

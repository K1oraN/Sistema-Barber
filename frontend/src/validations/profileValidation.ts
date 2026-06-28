import { z } from "zod";

export const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome completo."),
    phone: z.string().trim().min(10, "Informe um telefone valido."),
    birthDate: z.string().optional(),
    avatarUrl: z
      .string()
      .trim()
      .url("Informe uma URL valida.")
      .or(z.literal(""))
      .optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .or(z.literal(""))
      .optional(),
    confirmNewPassword: z
      .string()
      .or(z.literal(""))
      .optional(),
  })
  .superRefine((data, context) => {
    if (data.newPassword) {
      if (data.newPassword.length < 6) {
        context.addIssue({
          code: "custom",
          message: "A nova senha deve ter pelo menos 6 caracteres.",
          path: ["newPassword"],
        });
      }

      if (!data.currentPassword) {
        context.addIssue({
          code: "custom",
          message: "Informe a senha atual.",
          path: ["currentPassword"],
        });
      }

      if (data.confirmNewPassword !== data.newPassword) {
        context.addIssue({
          code: "custom",
          message: "As senhas nao conferem.",
          path: ["confirmNewPassword"],
        });
      }
    }
  });

export type ProfileFormData = z.infer<typeof profileSchema>;

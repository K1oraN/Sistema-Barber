import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome completo."),
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail.")
      .email("Informe um e-mail valido."),
    phone: z
      .string()
      .trim()
      .min(14, "Informe um telefone valido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
    acceptTerms: z.boolean().refine((value) => value, {
      message: "Voce precisa aceitar os termos.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao conferem.",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

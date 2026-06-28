import { z } from "zod";
import {
  atLeastOneField,
  dateString,
  nonEmptyString,
  nonNegativeInteger,
  optionalString,
  optionalUrl,
} from "./commonValidation.js";

export const createUserSchema = z.object({
  name: nonEmptyString("Informe o nome.").min(2, "Informe o nome completo."),
  email: z.string().email("Informe um e-mail valido."),
  phone: nonEmptyString("Informe o telefone.").min(10, "Informe um telefone valido."),
  birthDate: dateString.optional().nullable(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  role: z.enum(["CLIENT", "PROFESSIONAL", "ADMIN"]).default("CLIENT"),
  avatarUrl: optionalUrl,
  points: nonNegativeInteger.optional(),
  level: nonNegativeInteger.optional(),
  active: z.boolean().optional(),
});

export const createQuickClientSchema = z.object({
  name: nonEmptyString("Informe o nome.").min(2, "Informe o nome completo."),
  phone: nonEmptyString("Informe o telefone.").min(10, "Informe um telefone valido."),
  email: z.string().trim().email("Informe um e-mail valido.").optional().nullable(),
});

export const updateUserSchema = z
  .object({
    name: nonEmptyString("Informe o nome.").min(2, "Informe o nome completo.").optional(),
    email: z.string().email("Informe um e-mail valido.").optional(),
    phone: nonEmptyString("Informe o telefone.").min(10, "Informe um telefone valido.").optional(),
    birthDate: dateString.optional().nullable(),
    currentPassword: z.string().min(1, "Informe a senha atual.").optional(),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").optional(),
    role: z.enum(["CLIENT", "PROFESSIONAL", "ADMIN"]).optional(),
    avatarUrl: optionalString("Informe a URL do avatar."),
    points: nonNegativeInteger.optional(),
    level: nonNegativeInteger.optional(),
    active: z.boolean().optional(),
  })
  .refine(atLeastOneField(), {
    message: "Informe ao menos um campo para atualizar.",
  });

export const updateOwnUserSchema = z
  .object({
    name: nonEmptyString("Informe o nome.").min(2, "Informe o nome completo.").optional(),
    phone: nonEmptyString("Informe o telefone.").min(10, "Informe um telefone valido.").optional(),
    birthDate: dateString.optional().nullable(),
    currentPassword: z.string().min(1, "Informe a senha atual.").optional(),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").optional(),
    avatarUrl: optionalString("Informe a URL do avatar."),
  })
  .refine(atLeastOneField(), {
    message: "Informe ao menos um campo para atualizar.",
  });

export type CreateUserData = z.infer<typeof createUserSchema>;
export type CreateQuickClientData = z.infer<typeof createQuickClientSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type UpdateOwnUserData = z.infer<typeof updateOwnUserSchema>;

import { z } from "zod";
import { nonEmptyString } from "./commonValidation.js";

export const registerSchema = z.object({
  name: nonEmptyString("Informe o nome completo.").min(
    2,
    "Informe o nome completo.",
  ),
  email: z.string().email("Informe um e-mail valido."),
  phone: nonEmptyString("Informe um telefone valido.").min(
    10,
    "Informe um telefone valido.",
  ),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;

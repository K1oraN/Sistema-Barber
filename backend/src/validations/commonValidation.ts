import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("ID invalido."),
});

export const optionalActiveQuerySchema = z.object({
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === "true";
    }),
});

export const nonEmptyString = (message: string) => z.string().trim().min(1, message);

export const optionalString = (message: string) =>
  z.string().trim().min(1, message).optional().nullable();

export const optionalUrl = z
  .string()
  .trim()
  .url("Informe uma URL valida.")
  .optional()
  .nullable();

export const nonNegativeMoney = z.coerce
  .number()
  .nonnegative("O valor nao pode ser negativo.")
  .transform((value) => value.toFixed(2));

export const positiveMinutes = z.coerce
  .number()
  .int("Informe uma duracao inteira em minutos.")
  .positive("A duracao deve ser maior que zero.");

export const nonNegativeInteger = z.coerce
  .number()
  .int("Informe um numero inteiro.")
  .nonnegative("O valor nao pode ser negativo.");

export const positiveInteger = z.coerce
  .number()
  .int("Informe um numero inteiro.")
  .positive("O valor deve ser maior que zero.");

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato YYYY-MM-DD.");

export const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o horario no formato HH:mm.");

export function atLeastOneField() {
  return (data: object) => Object.keys(data).length > 0;
}

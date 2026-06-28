import { z } from "zod";

export const timeBlockSchema = z
  .object({
    date: z.string().min(1, "Informe a data."),
    endTime: z.string().min(1, "Informe o horario final."),
    reason: z.string().trim().optional(),
    startTime: z.string().min(1, "Informe o horario inicial."),
  })
  .superRefine((data, context) => {
    if (data.endTime <= data.startTime) {
      context.addIssue({
        code: "custom",
        message: "Horario final deve ser maior que o inicial.",
        path: ["endTime"],
      });
    }

    const startsAt = new Date(`${data.date}T${data.startTime}:00`);

    if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) {
      context.addIssue({
        code: "custom",
        message: "Nao e permitido bloquear horario passado.",
        path: ["startTime"],
      });
    }
  });

export type TimeBlockFormData = z.infer<typeof timeBlockSchema>;

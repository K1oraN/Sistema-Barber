import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1, "DATABASE_URL nao configurada."),
  JWT_SECRET: z.string().min(16, "JWT_SECRET precisa ter pelo menos 16 caracteres."),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Erro nas variaveis de ambiente do backend:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;

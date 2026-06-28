import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/appError.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Dados inválidos",
      errors: error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path,
      })),
    });
  }

  console.error(error);

  if (error instanceof Error) {
    return response.status(500).json({
      message: error.message || "Erro interno do servidor",
    });
  }

  return response.status(500).json({
    message: "Erro interno do servidor",
  });
}

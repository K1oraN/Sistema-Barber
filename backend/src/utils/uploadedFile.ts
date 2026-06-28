import type { Request } from "express";
import { AppError } from "./appError.js";

export function receiptFileFromRequest(request: Request) {
  if (!request.file) {
    throw new AppError("Selecione um comprovante para enviar.", 400);
  }

  return {
    receiptFileName: request.file.originalname,
    receiptUrl: `${request.protocol}://${request.get("host")}/uploads/receipts/${request.file.filename}`,
  };
}

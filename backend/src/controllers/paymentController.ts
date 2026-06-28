import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { paymentService } from "../services/paymentService.js";
import { receiptFileFromRequest } from "../utils/uploadedFile.js";

export async function listPayments(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await paymentService.list(actor);

  return response.json(result);
}

export async function getPayment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await paymentService.getById(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

export async function createPayment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await paymentService.create(actor, request.body);

  return response.status(201).json(result);
}

export async function updatePayment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await paymentService.update(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function updatePaymentLink(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await paymentService.updatePaymentLink(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function uploadPaymentReceipt(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await paymentService.uploadReceipt(
    actor,
    request.params.id as string,
    receiptFileFromRequest(request),
  );

  return response.json(result);
}

export async function deletePayment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await paymentService.remove(actor, request.params.id as string);

  return response.json(result);
}

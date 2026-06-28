import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { productOrderService } from "../services/productOrderService.js";
import { receiptFileFromRequest } from "../utils/uploadedFile.js";
import type { ProductOrderQueryData } from "../validations/productOrderValidation.js";

export async function listProductOrders(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await productOrderService.list(
    actor,
    request.validatedQuery as ProductOrderQueryData,
  );

  return response.json(result);
}

export async function getProductOrder(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await productOrderService.getById(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

export async function reserveProduct(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await productOrderService.reserve(actor, request.body);

  return response.status(201).json(result);
}

export async function preOrderProduct(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await productOrderService.preOrder(actor, request.body);

  return response.status(201).json(result);
}

export async function updateProductOrder(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await productOrderService.update(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function updateProductOrderPaymentLink(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await productOrderService.updatePaymentLink(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function uploadProductOrderReceipt(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await productOrderService.uploadReceipt(
    actor,
    request.params.id as string,
    receiptFileFromRequest(request),
  );

  return response.json(result);
}

export async function cancelProductOrder(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await productOrderService.cancel(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

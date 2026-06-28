import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { productService } from "../services/productService.js";

export async function listProducts(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await productService.list(
    actor,
    request.validatedQuery as { active?: boolean },
  );

  return response.json(result);
}

export async function getProduct(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await productService.getById(request.params.id as string, actor);

  return response.json(result);
}

export async function createProduct(request: Request, response: Response) {
  const result = await productService.create(request.body);

  return response.status(201).json(result);
}

export async function updateProduct(request: Request, response: Response) {
  const result = await productService.update(
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function deleteProduct(request: Request, response: Response) {
  const result = await productService.remove(request.params.id as string);

  return response.json(result);
}

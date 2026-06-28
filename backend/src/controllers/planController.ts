import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { planService } from "../services/planService.js";
import { receiptFileFromRequest } from "../utils/uploadedFile.js";

export async function listPlans(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.list(
    actor,
    request.validatedQuery as { active?: boolean },
  );

  return response.json(result);
}

export async function getPlan(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.getById(request.params.id as string, actor);

  return response.json(result);
}

export async function createPlan(request: Request, response: Response) {
  const result = await planService.create(request.body);

  return response.status(201).json(result);
}

export async function updatePlan(request: Request, response: Response) {
  const result = await planService.update(
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function deletePlan(request: Request, response: Response) {
  const result = await planService.remove(request.params.id as string);

  return response.json(result);
}

export async function listPlanSubscriptions(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.listSubscriptions(actor);

  return response.json(result);
}

export async function getMyPlanSubscription(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.getCurrentSubscription(actor);

  return response.json(result);
}

export async function subscribePlan(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.subscribe(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.status(201).json(result);
}

export async function approvePlanSubscription(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.approveSubscription(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

export async function updatePlanSubscriptionPaymentLink(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.updateSubscriptionPaymentLink(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function uploadPlanSubscriptionReceipt(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.uploadSubscriptionReceipt(
    actor,
    request.params.id as string,
    receiptFileFromRequest(request),
  );

  return response.json(result);
}

export async function cancelPlanSubscription(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.cancelSubscription(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

export async function renewPlanSubscription(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await planService.renewSubscription(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

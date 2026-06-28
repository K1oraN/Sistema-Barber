import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { appointmentService } from "../services/appointmentService.js";

export async function listAppointments(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await appointmentService.list(actor);

  return response.json(result);
}

export async function getAvailability(request: Request, response: Response) {
  const result = await appointmentService.getAvailability(
    request.validatedQuery as {
      date: string;
      professionalId: string;
      serviceId: string;
    },
  );

  return response.json(result);
}

export async function getAppointment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await appointmentService.getById(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

export async function createAppointment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await appointmentService.create(actor, request.body);

  return response.status(201).json(result);
}

export async function updateAppointment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await appointmentService.update(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function finishAppointment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await appointmentService.finish(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

export async function deleteAppointment(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await appointmentService.remove(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

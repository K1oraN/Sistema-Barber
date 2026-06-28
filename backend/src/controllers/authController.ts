import type { NextFunction, Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { authService } from "../services/authService.js";

export async function register(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.register(request.body);

    return response.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.login(request.body);

    return response.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function me(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(request);
    const result = await authService.me(user.id);

    return response.json(result);
  } catch (error) {
    return next(error);
  }
}

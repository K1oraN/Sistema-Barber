import type { Request, Response } from "express";

export function healthController(_request: Request, response: Response) {
  return response.json({
    status: "ok",
    service: "Club do Rafa API",
  });
}


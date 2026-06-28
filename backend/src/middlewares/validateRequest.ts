import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type RequestSchemas = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

export function validateRequest(schema: ZodSchema | RequestSchemas) {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      if ("parse" in schema) {
        request.body = schema.parse(request.body);
        return next();
      }

      if (schema.body) {
        request.body = schema.body.parse(request.body);
      }

      if (schema.params) {
        request.params = schema.params.parse(request.params) as typeof request.params;
      }

      if (schema.query) {
        request.validatedQuery = schema.query.parse(request.query);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

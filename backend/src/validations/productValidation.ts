import { z } from "zod";
import {
  atLeastOneField,
  nonEmptyString,
  nonNegativeInteger,
  nonNegativeMoney,
  optionalString,
  optionalUrl,
} from "./commonValidation.js";

export const createProductSchema = z.object({
  name: nonEmptyString("Informe o nome do produto."),
  description: optionalString("Informe a descricao do produto."),
  price: nonNegativeMoney,
  costPrice: nonNegativeMoney,
  stock: nonNegativeInteger,
  reservedStock: nonNegativeInteger.optional(),
  category: nonEmptyString("Informe a categoria do produto."),
  imageUrl: optionalUrl,
  active: z.boolean().optional(),
  allowPreOrder: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial().refine(atLeastOneField(), {
  message: "Informe ao menos um campo para atualizar.",
});

export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;

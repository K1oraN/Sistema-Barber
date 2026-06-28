import { api } from "../services/api";

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export function validateReceiptFile(file: File) {
  if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
    return "Envie um comprovante em PNG, JPG ou PDF.";
  }

  if (file.size > MAX_RECEIPT_SIZE) {
    return "Envie um comprovante de ate 5 MB.";
  }

  return null;
}

export async function uploadReceipt<T>(url: string, file: File) {
  const formData = new FormData();
  formData.append("receipt", file);

  const { data } = await api.post<T>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

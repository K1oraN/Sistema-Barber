import fs from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import { AppError } from "../utils/appError.js";

const receiptsDir = path.join(process.cwd(), "uploads", "receipts");
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

fs.mkdirSync(receiptsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, receiptsDir);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${randomUUID()}${extension}`;
    callback(null, safeName);
  },
});

export const receiptUpload = multer({
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError("Envie um comprovante em PNG, JPG ou PDF.", 400));
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  storage,
});

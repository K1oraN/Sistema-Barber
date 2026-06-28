import cors from "cors";
import express from "express";
import path from "node:path";
import { errorHandler } from "./middlewares/errorHandler.js";
import { routes } from "./routes/index.js";
import { env } from "./utils/env.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);
app.use(express.json({ limit: "8mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(routes);
app.use("/api", routes);
app.use(errorHandler);

export default app;

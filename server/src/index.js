process.on("uncaughtException", (e) => {
  console.error("UNCAUGHT_EXCEPTION:", e?.stack || e);
  process.exit(1);
});
process.on("unhandledRejection", (e) => {
  console.error("UNHANDLED_REJECTION:", e?.stack || e);
  process.exit(1);
});

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./migrate.js";

import { productsRouter } from "./routes.products.js";
import { ordersRouter } from "./routes.orders.js";
import { adminRouter } from "./routes.admin.js";
import { deliveryRouter } from "./routes.delivery.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// 🔥 ВОТ КЛЮЧЕВОЕ МЕСТО
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use("/d", deliveryRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("server on", port));

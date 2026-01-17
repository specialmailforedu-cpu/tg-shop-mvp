import express from "express";
import { q, one } from "./db.js";

export const productsRouter = express.Router();

productsRouter.get("/", (req, res) => {
  const search = (req.query.search || "").trim();
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  let rows;
  if (search) {
    rows = q(
      `SELECT * FROM products WHERE title LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset]
    );
  } else {
    rows = q(`SELECT * FROM products ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]);
  }

  res.json({ items: rows, page });
});

productsRouter.get("/:id", (req, res) => {
  const p = one(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
  if (!p) return res.status(404).json({ error: "not_found" });
  res.json(p);
});


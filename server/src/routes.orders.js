import express from "express";
import { one, run, q } from "./db.js";

export const ordersRouter = express.Router();

/**
 * MVP: без крипто-проверки initData.
 * Мы принимаем tgUserId/tgUsername из фронта.
 * Для продакшена нужно валидировать initData по Telegram docs.
 */
ordersRouter.post("/", (req, res) => {
  const { items, tgUserId, tgUsername } = req.body || {};
  if (!tgUserId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "bad_request" });
  }

  let total = 0;
  const expanded = [];

  for (const it of items) {
    const qty = Math.max(parseInt(it.qty || 1, 10), 1);
    const p = one(`SELECT id, price_rub FROM products WHERE id = ?`, [it.productId]);
    if (!p) return res.status(400).json({ error: "bad_product" });
    total += p.price_rub * qty;
    expanded.push({ productId: p.id, qty, price: p.price_rub });
  }

  const o = run(
    `INSERT INTO orders(tg_user_id, tg_username, status, total_rub)
     VALUES(?,?, 'WAITING_PAYMENT', ?)`,
    [String(tgUserId), tgUsername || null, total]
  );

  for (const it of expanded) {
    run(
      `INSERT INTO order_items(order_id, product_id, qty, price_rub)
       VALUES(?,?,?,?)`,
      [o.lastInsertRowid, it.productId, it.qty, it.price]
    );
  }

  res.json({ orderId: o.lastInsertRowid, status: "WAITING_PAYMENT", total_rub: total });
});

ordersRouter.get("/:id", (req, res) => {
  const orderId = req.params.id;
  const o = one(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!o) return res.status(404).json({ error: "not_found" });

  const items = q(
    `SELECT oi.qty, oi.price_rub, p.title
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  res.json({ order: o, items });
});


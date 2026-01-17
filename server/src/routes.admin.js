import express from "express";
import { q, one, run } from "./db.js";
import { encrypt, token } from "./crypto.js";

export const adminRouter = express.Router();

function adminAuth(req, res, next) {
  const key = req.headers["x-admin-key"] || "";
  if (key !== (process.env.ADMIN_KEY || "dev_admin")) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}
adminRouter.use(adminAuth);

adminRouter.get("/orders", (req, res) => {
  const status = req.query.status || "WAITING_PAYMENT";
  const rows = q(`SELECT * FROM orders WHERE status = ? ORDER BY id DESC LIMIT 200`, [status]);
  res.json({ items: rows });
});

adminRouter.post("/orders/:id/mark-paid", (req, res) => {
  const o = one(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
  if (!o) return res.status(404).json({ error: "not_found" });
  run(`UPDATE orders SET status='PAID', paid_at=datetime('now') WHERE id=?`, [req.params.id]);
  res.json({ ok: true });
});

adminRouter.post("/orders/:id/deliver", (req, res) => {
  const { secretText } = req.body || {};
  if (!secretText || String(secretText).trim().length < 5) {
    return res.status(400).json({ error: "bad_secret" });
  }

  const o = one(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
  if (!o) return res.status(404).json({ error: "not_found" });
  if (o.status !== "PAID") return res.status(400).json({ error: "order_not_paid" });

  const t = token();
  const cipher = encrypt(String(secretText));

  run(
    `INSERT OR REPLACE INTO deliveries(order_id, secret_ciphertext, secret_view_token)
     VALUES(?,?,?)`,
    [req.params.id, cipher, t]
  );
  run(`UPDATE orders SET status='DELIVERED', delivered_at=datetime('now') WHERE id=?`, [req.params.id]);

  res.json({ ok: true, viewToken: t, viewUrl: `/d/${t}` });
});


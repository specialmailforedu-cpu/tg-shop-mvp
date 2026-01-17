import express from "express";
import { one, run } from "./db.js";
import { decrypt } from "./crypto.js";

export const deliveryRouter = express.Router();

deliveryRouter.get("/:token", (req, res) => {
  const d = one(`SELECT * FROM deliveries WHERE secret_view_token = ?`, [req.params.token]);
  if (!d) return res.status(404).send("Not found");
  if (d.viewed_at) return res.status(410).send("Link already used");

  const text = decrypt(d.secret_ciphertext);
  run(`UPDATE deliveries SET viewed_at=datetime('now') WHERE id=?`, [d.id]);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <h2>Данные заказа</h2>
    <pre style="white-space:pre-wrap; font-size: 16px; line-height: 1.35">${escapeHtml(text)}</pre>
    <p><b>Внимание:</b> ссылка одноразовая и уже погашена.</p>
  `);
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#039;"
  }[c]));
}


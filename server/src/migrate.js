import { run, one } from "./db.js";

run(`CREATE TABLE IF NOT EXISTS products(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  price_rub INTEGER NOT NULL,
  region TEXT,
  stock_status TEXT NOT NULL DEFAULT 'IN_STOCK',
  cover_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

run(`CREATE TABLE IF NOT EXISTS orders(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_user_id TEXT NOT NULL,
  tg_username TEXT,
  status TEXT NOT NULL DEFAULT 'WAITING_PAYMENT',
  total_rub INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  delivered_at TEXT
)`);

run(`CREATE TABLE IF NOT EXISTS order_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  price_rub INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
)`);

run(`CREATE TABLE IF NOT EXISTS deliveries(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  secret_ciphertext TEXT NOT NULL,
  secret_view_token TEXT NOT NULL UNIQUE,
  viewed_at TEXT,
  expires_at TEXT,
  FOREIGN KEY(order_id) REFERENCES orders(id)
)`);

run(`CREATE TABLE IF NOT EXISTS admins(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'manager'
)`);

run(`CREATE TABLE IF NOT EXISTS audit_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_tg_user_id TEXT,
  action TEXT NOT NULL,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// seed products only if empty
const cnt = one(`SELECT COUNT(*) as c FROM products`)?.c || 0;
if (cnt === 0) {
  run(
    `INSERT INTO products(title, description, price_rub, region, stock_status, cover_url)
     VALUES
     ('GTA 6 (аккаунт)', 'Аккаунт с игрой. Регион: TR. Выдача инструкцией.', 2000, 'TR', 'IN_STOCK', ''),
     ('Spider-Man 2 (аккаунт)', 'Аккаунт с игрой. Регион: TR. Выдача инструкцией.', 1500, 'TR', 'IN_STOCK', ''),
     ('FC 26 (аккаунт)', 'Аккаунт с игрой. Регион: TR. Выдача инструкцией.', 1800, 'TR', 'IN_STOCK', '')
    `
  );
}


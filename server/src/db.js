import Database from "better-sqlite3";

export const db = new Database(process.env.DB_PATH || "./data.sqlite");

export function q(sql, params = []) {
  return db.prepare(sql).all(params);
}
export function one(sql, params = []) {
  return db.prepare(sql).get(params);
}
export function run(sql, params = []) {
  return db.prepare(sql).run(params);
}


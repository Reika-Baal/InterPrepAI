import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { bank } from "./questions.mjs";
export function openDb(path) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,workspace TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS auth(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS questions(id TEXT PRIMARY KEY,body TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS sessions_owner ON sessions(user_id);
 CREATE TABLE IF NOT EXISTS usage(day TEXT NOT NULL,scope TEXT NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(day,scope));
 CREATE TABLE IF NOT EXISTS guest_users(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
 PRAGMA user_version=2;`);
  const seed = db.prepare(
    "INSERT INTO questions(id,body) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
  );
  for (const q of bank) {
    if (q.criteria.reduce((n, c) => n + c.weight, 0) !== 100)
      throw Error("Invalid rubric");
    seed.run(q.id, JSON.stringify(q));
  }
  return db;
}
export const emptyWorkspace = () => ({
  profile: { name: "Your name", role: "" },
  interviews: [],
  tasks: [false, false, false],
});
